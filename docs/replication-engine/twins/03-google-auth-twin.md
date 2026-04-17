# Implementation Guide: Google Auth Twin

## Summary

This is the third vertical slice. It delivers a local twin for Google OAuth 2.0 flows — both server-side token exchange and browser-side OAuth redirects. This slice **extends the interception layer to handle browser OAuth redirects**, establishing the pattern that Calendar and Spotify twins reuse later.

---

## 1. Goals

* Intercept OAuth authorization redirects in the browser and auto-complete them with configurable test user identities.
* Handle server-side token exchange (`POST /oauth2/v4/token`) locally.
* Support configurable user identities with arbitrary role/permission structures for testing authorization matrices.
* Support session lifecycle testing (expiry, refresh, re-auth).
* Enable both "known user signs in" and "unknown user blocked" scenarios.
* Establish the browser-side interception pattern (MSW) for later twins.

---

## 2. Architecture

```
Browser:
┌───────────────┐     ┌─────────────────────┐     ┌──────────────────┐
│ App navigates │────>│  MSW Service Worker  │────>│  Auth Twin       │
│ to Google     │     │  (URL rewrite)       │     │  localhost:9011  │
│ OAuth URL     │     └─────────────────────┘     └──────────────────┘
└───────────────┘                                          │
                                                           │ auto-completes
                                                           │ OAuth flow
                                                           ▼
                                                  ┌──────────────────┐
                                                  │ Redirect back to │
                                                  │ app callback URL │
                                                  │ with auth code   │
                                                  └──────────────────┘

Server:
┌───────────────┐     ┌─────────────────────┐     ┌──────────────────┐
│ App exchanges │────>│  Node Interceptor   │────>│  Auth Twin       │
│ code for      │     │  (fetch rewrite)    │     │  localhost:9011  │
│ tokens        │     └─────────────────────┘     └──────────────────┘
└───────────────┘
```

### Port Assignment

| Host | Port |
| --- | --- |
| `accounts.google.com` | 9011 |
| `oauth2.googleapis.com` | 9011 |

Shares port 9011 with Gmail twin. Routes are disambiguated by path prefix.

---

## 3. Directory Structure

```
packages/integration-test-doubles/
  src/
    interceptor/
      browser-interceptor.ts     # NEW: MSW-based browser interceptor
      msw-handlers.ts            # NEW: MSW request handlers
      // existing: node-interceptor.ts, routing-table.ts
    google-auth/
      index.ts                   # Public API exports
      auth-twin.ts               # Twin lifecycle + Express routes
      auth-twin.config.ts        # Configuration
      identity-store.ts          # Configurable test user identities
      token-store.ts             # Issued tokens, refresh tokens, expiry
      oauth-page.ts              # HTML page that auto-completes OAuth
      __tests__/
        auth-twin.spec.ts
```

---

## 4. Browser Interception Layer (New — Established Here)

### 4.1 MSW (Mock Service Worker) Integration

Use [MSW](https://mswjs.io/) to intercept browser-side requests. MSW installs a Service Worker that intercepts `fetch` and `XMLHttpRequest` calls matching specified patterns.

**Why MSW:**

* Industry-standard for browser request interception in tests.
* Works with any framework (React, Next.js, Angular, etc.).
* No application code changes — the service worker is installed externally.
* Supports both REST and GraphQL interception.

### 4.2 Browser Interceptor

```
// src/interceptor/browser-interceptor.ts
import { setupWorker } from 'msw/browser';
import { buildHandlers } from './msw-handlers';
import { RoutingTable } from './routing-table';

export class BrowserInterceptor {
  private worker: ReturnType<typeof setupWorker>;
  private routingTable: RoutingTable;

  constructor(routingTable: RoutingTable);

  /**
   * Start the MSW service worker.
   * Call this early in the application's browser entry point.
   */
  async install(): Promise<void>;

  /**
   * Stop the service worker.
   */
  async uninstall(): Promise<void>;
}
```

### 4.3 MSW Handlers

```
// src/interceptor/msw-handlers.ts
import { http, HttpResponse } from 'msw';
import { RoutingTable } from './routing-table';

export function buildHandlers(routingTable: RoutingTable) {
  return routingTable.entries.map((entry) =>
    http.all(`https://${entry.hostname}/*`, async ({ request }) => {
      const originalUrl = new URL(request.url);
      const targetUrl = new URL(originalUrl.pathname + originalUrl.search, entry.target);

      const response = await fetch(targetUrl.toString(), {
        method: request.method,
        headers: request.headers,
        body: request.body,
      });

      return new HttpResponse(response.body, {
        status: response.status,
        headers: response.headers,
      });
    })
  );
}
```

### 4.4 Service Worker File

MSW requires a service worker file served from the application's public directory. The library should:

1. Export a CLI command or script to copy the MSW service worker to a target directory:

    ```
     npx integration-test-doubles setup-msw --outDir ./public
    ```
2. Document that consuming apps need this file in their public/static directory.
3. The service worker file is the standard `mockServiceWorker.js` from MSW.

### 4.5 OAuth Redirect Interception

OAuth flows are special — they're full-page navigations, not `fetch` calls. MSW alone cannot intercept `window.location` changes. Two strategies:

**Strategy A: Navigation Intercept (Recommended)**

Register an MSW handler for the Google OAuth authorize URL that returns an HTML page instead of redirecting to Google:

```
http.get('https://accounts.google.com/o/oauth2/v2/auth', ({ request }) => {
  const url = new URL(request.url);
  const redirectUri = url.searchParams.get('redirect_uri');
  const state = url.searchParams.get('state');
  const scope = url.searchParams.get('scope');

  // Return HTML that auto-submits to the callback
  return new HttpResponse(
    buildOAuthCompletionPage({ redirectUri, state, scope }),
    { headers: { 'Content-Type': 'text/html' } }
  );
});
```

**Strategy B: Direct URL Rewrite**

If the application opens OAuth in a popup or iframe, the MSW handler can intercept the request and redirect to the local twin's OAuth page, which then redirects back.

Choose Strategy A as the default — it works for both popup and redirect OAuth flows.

---

## 5. Identity Store

### 5.1 Configuration

```
// src/google-auth/identity-store.ts
export interface TestIdentity {
  id: string;                    // Unique identifier (e.g., "user-admin", "user-viewer")
  email: string;                 // e.g., "admin@example.com"
  name: string;                  // e.g., "Test Admin"
  picture?: string;              // URL to avatar (can be local)
  roles?: string[];              // Application-specific roles
  permissions?: string[];        // Application-specific permissions
  metadata?: Record<string, unknown>;  // Arbitrary additional claims
}

export class IdentityStore {
  private identities: Map<string, TestIdentity> = new Map();
  private activeIdentity: TestIdentity | null = null;

  /** Register a test identity */
  addIdentity(identity: TestIdentity): void;

  /** Set which identity will be used for the next OAuth flow */
  setActiveIdentity(id: string): void;

  /** Get the currently active identity */
  getActiveIdentity(): TestIdentity | null;

  /** Get all registered identities */
  getAllIdentities(): TestIdentity[];

  /** Clear all identities and reset to defaults */
  reset(): void;
}
```

### 5.2 Default Identities

Ship with a sensible set of defaults that cover common authorization patterns:

```
const defaultIdentities: TestIdentity[] = [
  {
    id: 'default-user',
    email: 'testuser@example.com',
    name: 'Test User',
    roles: ['user'],
  },
  {
    id: 'admin-user',
    email: 'admin@example.com',
    name: 'Test Admin',
    roles: ['admin', 'user'],
  },
  {
    id: 'readonly-user',
    email: 'viewer@example.com',
    name: 'Test Viewer',
    roles: ['viewer'],
  },
];
```

Consuming applications can add their own identities or replace the defaults entirely.

---

## 6. Token Store

```
// src/google-auth/token-store.ts
export interface IssuedToken {
  accessToken: string;
  refreshToken: string;
  idToken: string;          // JWT containing identity claims
  expiresAt: Date;
  scopes: string[];
  identity: TestIdentity;
}

export class TokenStore {
  private tokens: Map<string, IssuedToken> = new Map();

  /** Issue a new token set for an identity */
  issueTokens(identity: TestIdentity, scopes: string[]): IssuedToken;

  /** Validate an access token and return the associated identity */
  validateAccessToken(token: string): TestIdentity | null;

  /** Exchange a refresh token for new access/id tokens */
  refreshTokens(refreshToken: string): IssuedToken | null;

  /** Expire a specific token (for testing expiry flows) */
  expireToken(accessToken: string): void;

  /** Revoke all tokens for an identity (for testing revocation) */
  revokeTokensForIdentity(identityId: string): void;

  /** Clear all issued tokens */
  clear(): void;
}
```

**Token format:**

* Access tokens: `test-access-<uuid>` (opaque strings, no need for real JWT format).
* Refresh tokens: `test-refresh-<uuid>`.
* ID tokens: Actual JWT (unsigned) with standard Google claims (`sub`, `email`, `name`, `picture`, `iss`, `aud`, `exp`, `iat`). Use a library like `jsonwebtoken` to create them with `algorithm: 'none'`.

---

## 7. Auth Twin Server

### 7.1 Public API

```
// src/google-auth/auth-twin.ts
export class GoogleAuthTwin {
  constructor(config?: Partial<AuthTwinConfig>);

  async start(): Promise<void>;
  async stop(): Promise<void>;
  async reset(): Promise<void>;
  async isHealthy(): Promise<boolean>;

  /** Get the identity store for programmatic identity management */
  getIdentityStore(): IdentityStore;

  /** Get the token store for programmatic token management */
  getTokenStore(): TokenStore;
}
```

### 7.2 API Endpoints

#### OAuth Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/o/oauth2/v2/auth` | OAuth authorization page (auto-completes) |
| `POST` | `/oauth2/v4/token` | Token exchange and refresh |
| `GET` | `/oauth2/v1/userinfo` | User info endpoint |
| `GET` | `/oauth2/v1/certs` | JWKS endpoint (returns empty/test keys) |

#### OAuth Authorization Flow

When the twin receives a request to `/o/oauth2/v2/auth`:

1. Extract parameters: `redirect_uri`, `state`, `scope`, `client_id`, `response_type`.
2. Look up the active identity from the identity store.
3. Generate an authorization code.
4. Return an HTML page that auto-redirects to the `redirect_uri` with `code` and `state` parameters.

**Auto-completion page:**

```
<!DOCTYPE html>
<html>
<body>
  <p>Completing OAuth flow for: {{identity.email}}</p>
  <script>
    window.location.href = '{{redirect_uri}}?code={{auth_code}}&state={{state}}';
  </script>
</body>
</html>
```

For the "unknown user blocked" scenario, the page instead redirects with an `error=access_denied` parameter.

#### Token Exchange

`POST /oauth2/v4/token` handles two grant types:

**Authorization code exchange:**

```
grant_type=authorization_code&code=<code>&redirect_uri=<uri>&client_id=<id>&client_secret=<secret>
```

Response:

```
{
  "access_token": "test-access-<uuid>",
  "refresh_token": "test-refresh-<uuid>",
  "id_token": "<unsigned-jwt>",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "openid email profile"
}
```

**Refresh token exchange:**

```
grant_type=refresh_token&refresh_token=<token>&client_id=<id>&client_secret=<secret>
```

Returns new access and id tokens with the same identity.

#### User Info

`GET /oauth2/v1/userinfo` with `Authorization: Bearer <token>`:

```
{
  "id": "<identity.id>",
  "email": "<identity.email>",
  "name": "<identity.name>",
  "picture": "<identity.picture>",
  "verified_email": true
}
```

#### Test Control API

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/test/auth/health` | Health check |
| `POST` | `/test/auth/reset` | Reset all state (tokens, identities to defaults) |
| `GET` | `/test/auth/identities` | List all configured identities |
| `POST` | `/test/auth/identities` | Add or update a test identity |
| `PUT` | `/test/auth/active-identity` | Set the active identity for next OAuth flow |
| `POST` | `/test/auth/error-mode` | Configure error simulation |
| `DELETE` | `/test/auth/error-mode` | Clear error simulation |
| `POST` | `/test/auth/expire-tokens` | Expire all current tokens (trigger re-auth) |
| `POST` | `/test/auth/block-user` | Block next OAuth attempt (unknown user scenario) |

---

## 8. Session Lifecycle Testing

### 8.1 Configurable Expiry

```
export interface AuthTwinConfig {
  port: number;
  tokenExpirySeconds: number;       // Default: 3600
  shortExpirySeconds: number;       // For testing expiry: 5
}
```

Test control API can switch between normal and short expiry:

```
POST /test/auth/config
{ "tokenExpiry": "short" }
```

### 8.2 Scenarios

| Scenario | How to trigger | Expected behavior |
| --- | --- | --- |
| Normal sign-in | Set active identity, trigger OAuth | Token issued, app logs in |
| Token expiry | Set short expiry, wait | App refreshes token automatically |
| Refresh token revoked | Call `/test/auth/expire-tokens` + revoke refresh | App redirects to sign-in |
| Unknown user blocked | Call `/test/auth/block-user` | OAuth returns `error=access_denied` |
| Role-based access | Set identity with specific roles | App enforces permissions accordingly |
| Session timeout | Set short expiry, don't refresh | App detects expired session |

---

## 9. Error Simulation

| Mode | Behavior |
| --- | --- |
| `invalid-grant` | Token exchange returns `{ "error": "invalid_grant" }` with 400 |
| `token-expired` | All access token validations return 401 |
| `refresh-revoked` | Refresh token exchange returns `{ "error": "invalid_grant" }` |
| `server-error` | All endpoints return 500 |
| `blocked-user` | OAuth auto-complete redirects with `error=access_denied` |

---

## 10. Routing Table Updates

This slice adds the following entries to the shared routing table:

```
{ hostname: 'accounts.google.com', target: 'http://localhost:9011' },
{ hostname: 'oauth2.googleapis.com', target: 'http://localhost:9011' },
```

Both Node.js and browser interceptors consume these entries.

---

## 11. Testing the Twin

```
describe('GoogleAuthTwin', () => {
  let twin: GoogleAuthTwin;

  beforeAll(async () => {
    twin = new GoogleAuthTwin();
    await twin.start();
  });

  afterAll(async () => {
    await twin.stop();
  });

  beforeEach(async () => {
    await twin.reset();
  });

  describe('OAuth flow', () => {
    it('should auto-complete OAuth and redirect with auth code', async () => {
      twin.getIdentityStore().setActiveIdentity('default-user');
      const response = await fetch(
        'http://localhost:9011/o/oauth2/v2/auth?redirect_uri=http://localhost:3000/callback&state=xyz&scope=openid+email&client_id=test&response_type=code',
        { redirect: 'manual' }
      );
      // Should return HTML that redirects to callback with code
      const html = await response.text();
      expect(html).toContain('localhost:3000/callback');
      expect(html).toContain('code=');
    });

    it('should block unknown users', async () => {
      await fetch('http://localhost:9011/test/auth/block-user', { method: 'POST' });
      const response = await fetch(
        'http://localhost:9011/o/oauth2/v2/auth?redirect_uri=http://localhost:3000/callback&state=xyz',
        { redirect: 'manual' }
      );
      const html = await response.text();
      expect(html).toContain('error=access_denied');
    });
  });

  describe('Token exchange', () => {
    it('should exchange auth code for tokens', async () => {
      // ... trigger OAuth, get code, exchange for tokens
    });

    it('should refresh tokens', async () => {
      // ... exchange code, then refresh
    });

    it('should reject expired refresh tokens', async () => {
      // ... revoke, then attempt refresh
    });
  });

  describe('Identity management', () => {
    it('should support custom identities', async () => {
      twin.getIdentityStore().addIdentity({
        id: 'custom-role',
        email: 'manager@example.com',
        name: 'Manager User',
        roles: ['manager', 'user'],
      });
      twin.getIdentityStore().setActiveIdentity('custom-role');
      // OAuth flow should use this identity
    });

    it('should return identity info via userinfo endpoint', async () => {
      // ... after OAuth, query userinfo with access token
    });
  });
});

describe('BrowserInterceptor', () => {
  it('should intercept OAuth navigation and redirect to twin', async () => {
    // Test in a browser environment (e.g., Playwright)
  });

  it('should rewrite fetch calls to matching hostnames', async () => {
    // Verify MSW handlers are working
  });
});
```

---

## 12. Checklist

* OAuth authorization endpoint returns auto-completing HTML page
* Token exchange works for both `authorization_code` and `refresh_token` grant types
* ID tokens are valid (unsigned) JWTs with correct claims
* Userinfo endpoint returns identity data for valid access tokens
* Identity store supports adding, updating, and switching active identities
* Default identities cover common authorization patterns (user, admin, viewer)
* Token expiry is configurable and triggers re-auth when expired
* "Unknown user blocked" scenario redirects with `error=access_denied`
* Browser interceptor (MSW) correctly intercepts OAuth navigations
* MSW service worker setup script/CLI is documented
* Routing table updated with `accounts.google.com` and `oauth2.googleapis.com`
* Error simulation modes work correctly
* Test control API endpoints function as specified
* `reset()` clears tokens and restores default identities
* All twin and interceptor tests pass

‌