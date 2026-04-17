# Implementation Guide: Gmail / Google Workspace Email Twin

## Summary

This is the second vertical slice. It delivers a local twin for the Gmail send API — a single-endpoint server that captures outbound emails for test assertion. This is the **first integration requiring the network interception layer**, so it establishes the Node.js interceptor module pattern that all subsequent server-side twins reuse.

---

## 1. Goals

* Intercept outbound `POST /gmail/v1/users/me/messages/send` calls at the network level and route them to a local twin.
* Capture sent emails in an in-memory store, queryable by recipient.
* Enable end-to-end testing of email-dependent flows (invitations, magic links, notifications) without hitting Gmail.
* Establish the Node.js network interception pattern for the library.

---

## 2. Architecture

### 2.1 Components

```
┌─────────────────────┐     ┌──────────────────────┐
│  Application Code   │────>│  Node.js Interceptor │
│  (gmail API call)   │     │  (global fetch hook) │
└─────────────────────┘     └──────────┬───────────┘
                                       │ rewrites host
                                       ▼
                            ┌──────────────────────┐
                            │   Gmail Twin Server  │
                            │   localhost:9011     │
                            └──────────────────────┘
```

### 2.2 Port Assignment

| Host | Port |
| --- | --- |
| `gmail.googleapis.com` | 9011 |

Port 9011 is shared with Google OAuth and Calendar (added in later slices). This twin owns the `/gmail/` path prefix.

---

## 3. Directory Structure

```
packages/integration-test-doubles/
  src/
    interceptor/
      index.ts                      # Public API for interceptor
      node-interceptor.ts           # Global fetch/HTTP interceptor for Node.js
      routing-table.ts              # Declarative hostname -> localhost map
      routing-table.config.ts       # Default routing entries
    gmail/
      index.ts                      # Public API exports
      gmail-twin.ts                 # Twin lifecycle + Express server
      gmail-twin.config.ts          # Configuration
      email-store.ts                # In-memory email capture store
      __tests__/
        gmail-twin.spec.ts          # Integration tests
```

---

## 4. Network Interception Layer (New — Established Here)

This is the foundational infrastructure for all subsequent twins that don't have native emulator support.

### 4.1 Routing Table

A declarative map of third-party hostnames to local twin addresses:

```
// src/interceptor/routing-table.ts
export interface RoutingEntry {
  hostname: string;
  target: string;       // e.g., "http://localhost:9011"
  pathPrefix?: string;  // optional: only intercept paths starting with this
}

export interface RoutingTable {
  entries: RoutingEntry[];
  resolve(url: URL): string | null;  // Returns rewritten URL or null if no match
}
```

**Initial entries (added by this slice):**

```
{ hostname: 'gmail.googleapis.com', target: 'http://localhost:9011' }
```

Each subsequent twin adds its own entries. The table is the single source of truth for all interception.

### 4.2 Node.js Interceptor

Intercept outbound HTTP requests globally without modifying application code.

**Strategy:** Patch the global `fetch` and optionally `http.request`/`https.request` to consult the routing table before making the request.

```
// src/interceptor/node-interceptor.ts
export class NodeInterceptor {
  private originalFetch: typeof globalThis.fetch;
  private routingTable: RoutingTable;
  private active: boolean = false;

  constructor(routingTable: RoutingTable);

  /**
   * Install the interceptor. Replaces globalThis.fetch with a version
   * that rewrites URLs matching the routing table.
   */
  install(): void;

  /**
   * Remove the interceptor. Restores the original fetch.
   */
  uninstall(): void;

  /**
   * Check if the interceptor is currently active.
   */
  isActive(): boolean;
}
```

**Implementation details:**

1. Save a reference to the original `globalThis.fetch`.
2. Replace `globalThis.fetch` with a wrapper that:

    * Parses the request URL.
    * Checks the routing table for a matching hostname.
    * If matched, rewrites the URL to the local target (preserving path, query, headers, body).
    * Calls the original `fetch` with the rewritten URL.
    * If not matched, calls the original `fetch` unchanged.
    
3. On `uninstall()`, restore the original `fetch`.

**Important considerations:**

* Preserve all request properties (method, headers, body, signal, etc.) — only the URL changes.
* Forward the original `Host` header as `X-Original-Host` so twins can inspect it if needed.
* Log intercepted requests at debug level for troubleshooting.
* The interceptor must be idempotent — calling `install()` twice should not double-wrap.

### 4.3 Alternative: `undici` MockAgent

For Node.js applications using `undici` (which backs `globalThis.fetch` in Node 18+), consider using `undici.MockAgent` with `intercept()` as a cleaner interception mechanism. Evaluate both approaches and choose based on reliability:

```
import { MockAgent, setGlobalDispatcher } from 'undici';

const agent = new MockAgent();
agent.enableNetConnect((host) => !routingTable.has(host));
setGlobalDispatcher(agent);
```

Document whichever approach is chosen and why.

---

## 5. Gmail Twin Server

### 5.1 Configuration

```
// src/gmail/gmail-twin.config.ts
export interface GmailTwinConfig {
  port: number;
}

export const defaultGmailConfig: GmailTwinConfig = {
  port: 9011,
};
```

### 5.2 Public API

```
// src/gmail/gmail-twin.ts
export class GmailTwin {
  constructor(config?: Partial<GmailTwinConfig>);

  async start(): Promise<void>;
  async stop(): Promise<void>;
  async reset(): Promise<void>;
  async isHealthy(): Promise<boolean>;

  /** Query captured emails programmatically (also available via HTTP) */
  getEmails(recipientAddress: string): CapturedEmail[];

  /** Get all captured emails */
  getAllEmails(): CapturedEmail[];
}
```

### 5.3 Email Store

```
// src/gmail/email-store.ts
export interface CapturedEmail {
  id: string;
  threadId: string;
  to: string;
  from: string;
  subject: string;
  html?: string;
  text?: string;
  timestamp: Date;
  raw: string;  // Original base64url-encoded MIME message
}

export class EmailStore {
  private emails: CapturedEmail[] = [];

  capture(rawMessage: string): CapturedEmail;
  query(recipientAddress: string): CapturedEmail[];
  getAll(): CapturedEmail[];
  clear(): void;
}
```

### 5.4 API Endpoints

#### Gmail API Surface

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/gmail/v1/users/me/messages/send` | Capture outbound email |

**Request handling:**

1. **Auth validation:** Check for `Authorization: Bearer <token>` header. Accept any well-formed JWT — validate structure (three dot-separated base64url segments) but do not verify the signature. This confirms application code is constructing auth correctly without requiring real credentials.
2. **Decode the message:** The request body contains `{ raw: "<base64url-encoded MIME>" }`. Decode the `raw` field to extract:

    * `From` header
    * `To` header (may be multiple recipients)
    * `Subject` header
    * Body (HTML and/or plain text parts)
    
3. **Store the email:** Create a `CapturedEmail` record with a generated `id` and `threadId`.
4. **Return a valid response:**

    ```
     {
       "id": "msg-<uuid>",
       "threadId": "thread-<uuid>",
       "labelIds": ["SENT"]
     }
    ```

#### MIME Decoding

Use a lightweight MIME parser (e.g., `mailparser` npm package) to extract headers and body parts from the decoded raw message. Handle:

* Simple text/plain messages
* Simple text/html messages
* Multipart messages with both text and HTML alternatives
* Messages with the standard Gmail headers (From, To, Subject, Date, Message-ID)

#### Test Control API

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/test/gmail/health` | Returns 200 if twin is running |
| `POST` | `/test/gmail/reset` | Clear all captured emails |
| `GET` | `/test/gmail/emails` | Get all captured emails |
| `GET` | `/test/gmail/emails?to={address}` | Get emails for a specific recipient (most recent first) |
| `POST` | `/test/gmail/error-mode` | Configure error simulation |
| `DELETE` | `/test/gmail/error-mode` | Clear error simulation |

---

## 6. Error Simulation

| Mode | Behavior |
| --- | --- |
| `insufficient-permissions` | Returns 403 with `"error": { "code": 403, "message": "Insufficient Permission", "errors": [{ "reason": "insufficientPermissions" }] }` |
| `rate-limit` | Returns 429 with `Retry-After` header |
| `invalid-recipient` | Returns 400 with `"error": { "code": 400, "message": "Invalid To header" }` |

Activated and deactivated via the test control API, same pattern as GCS twin.

---

## 7. E2E Test Usage Pattern

This is the canonical flow that consuming applications will use:

```
// 1. Application action triggers an email
await page.click('[data-testid="send-invitation"]');

// 2. Wait briefly for the email to be captured
await new Promise(r => setTimeout(r, 500));

// 3. Query the twin for the captured email
const response = await fetch(
  'http://localhost:9011/test/gmail/emails?to=newuser@example.com'
);
const emails = await response.json();
const latestEmail = emails[0];

// 4. Extract a link from the email body
const linkMatch = latestEmail.html.match(/href="([^"]+)"/);
const invitationUrl = linkMatch[1];

// 5. Navigate to the link to complete the flow
await page.goto(invitationUrl);
```

This pattern — trigger action, query twin, extract data, continue flow — is the standard approach for testing any email-dependent feature.

---

## 8. Startup Integration

### Programmatic

```
import { GmailTwin } from 'integration-test-doubles/gmail';
import { NodeInterceptor } from 'integration-test-doubles/interceptor';
import { createRoutingTable } from 'integration-test-doubles/interceptor';

// In test global setup:
const gmailTwin = new GmailTwin();
await gmailTwin.start();

const interceptor = new NodeInterceptor(createRoutingTable());
interceptor.install();
```

### Script

```
#!/bin/bash
# scripts/start-gmail-twin.sh
set -euo pipefail

PORT="${GMAIL_TWIN_PORT:-9011}"

echo "Starting Gmail twin on port $PORT..."

# Start the twin server (run as background process or via node)
node -e "
  const { GmailTwin } = require('./dist/gmail');
  const twin = new GmailTwin({ port: $PORT });
  twin.start().then(() => console.log('Gmail twin ready on port $PORT'));
"
```

---

## 9. Testing the Twin

```
describe('GmailTwin', () => {
  let twin: GmailTwin;

  beforeAll(async () => {
    twin = new GmailTwin();
    await twin.start();
  });

  afterAll(async () => {
    await twin.stop();
  });

  beforeEach(async () => {
    await twin.reset();
  });

  it('should capture a sent email', async () => {
    const raw = buildRawEmail({
      from: 'sender@example.com',
      to: 'recipient@example.com',
      subject: 'Test Subject',
      html: '<p>Hello</p>',
    });

    const response = await fetch('http://localhost:9011/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.test.signature',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw }),
    });

    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.id).toBeDefined();
    expect(result.labelIds).toContain('SENT');

    const emails = twin.getEmails('recipient@example.com');
    expect(emails).toHaveLength(1);
    expect(emails[0].subject).toBe('Test Subject');
    expect(emails[0].html).toContain('Hello');
  });

  it('should return emails most recent first', async () => {
    await sendTestEmail('recipient@example.com', 'First');
    await sendTestEmail('recipient@example.com', 'Second');

    const emails = twin.getEmails('recipient@example.com');
    expect(emails[0].subject).toBe('Second');
    expect(emails[1].subject).toBe('First');
  });

  it('should filter by recipient', async () => {
    await sendTestEmail('alice@example.com', 'For Alice');
    await sendTestEmail('bob@example.com', 'For Bob');

    expect(twin.getEmails('alice@example.com')).toHaveLength(1);
    expect(twin.getEmails('bob@example.com')).toHaveLength(1);
    expect(twin.getEmails('nobody@example.com')).toHaveLength(0);
  });

  it('should clear emails on reset', async () => {
    await sendTestEmail('recipient@example.com', 'Test');
    await twin.reset();
    expect(twin.getEmails('recipient@example.com')).toHaveLength(0);
  });

  it('should simulate insufficient permissions', async () => {
    await fetch('http://localhost:9011/test/gmail/error-mode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'insufficient-permissions' }),
    });

    const response = await fetch('http://localhost:9011/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: buildRawEmail({ to: 'test@example.com' }) }),
    });

    expect(response.status).toBe(403);
  });
});

describe('NodeInterceptor', () => {
  it('should rewrite matching URLs to local targets', async () => {
    // Verify that fetch('https://gmail.googleapis.com/...') hits localhost:9011
  });

  it('should pass through non-matching URLs unchanged', async () => {
    // Verify that fetch('https://example.com/...') is not intercepted
  });

  it('should preserve request method, headers, and body', async () => {
    // Verify full request fidelity through the interceptor
  });
});
```

---

## 10. MIME Encoding Helper

Provide a test utility for constructing raw email messages:

```
// src/gmail/test-utils.ts
export function buildRawEmail(options: {
  from?: string;
  to: string;
  subject?: string;
  html?: string;
  text?: string;
}): string {
  const lines = [
    `From: ${options.from ?? 'test@example.com'}`,
    `To: ${options.to}`,
    `Subject: ${options.subject ?? 'Test Email'}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset="UTF-8"`,
    '',
    options.html ?? options.text ?? '<p>Test body</p>',
  ];
  return Buffer.from(lines.join('\r\n'))
    .toString('base64url');
}
```

---

## 11. Checklist

* Node.js interceptor installs and uninstalls cleanly
* Routing table correctly maps `gmail.googleapis.com` to `localhost:9011`
* Interceptor rewrites URLs while preserving method, headers, and body
* Interceptor passes through non-matching URLs unchanged
* `POST /gmail/v1/users/me/messages/send` accepts and decodes raw MIME messages
* JWT auth header structure is validated (but signature is not verified)
* Captured emails are stored and queryable by recipient
* Emails are returned most-recent-first
* Test control endpoints work (health, reset, query, error-mode)
* Error simulation modes return correct status codes and error bodies
* `reset()` clears all captured emails
* MIME encoding test utility works for simple and multipart messages
* Twin integration tests pass
* Interceptor integration tests pass

‌