import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';
import type OAuth2 = require('passport-oauth2');
import { randomUUID } from 'crypto';
import type { Request } from 'express';
import axios from 'axios';
import { ApiLogEntryDto } from './google-auth-emulate.dto';
import {
  GoogleAuthEmulateService,
  DEFAULT_GOOGLE_EMULATOR_PORT,
} from './google-auth-emulate.service';
import { InMemoryOAuthStateStore } from './google-auth-emulate.state-store';

/** The `oauth` client's `_request` is `protected` in its typings but is a
 * plain writable method at runtime, and passport-google-oauth20 documents
 * `_oauth2` as usable by subclasses. Expose a public shape for wrapping it. */
interface OAuth2RequestClient {
  _request(
    method: string,
    url: string,
    headers: Record<string, string> | null,
    postBody: string,
    accessToken: string | null,
    callback: (err: unknown, data?: string, response?: unknown) => void
  ): void;
}

/** Shape of the token endpoint response that passport-oauth2 forwards to the
 * verify callback as `params` when the callback declares 5 parameters. */
interface GoogleTokenResponseParams {
  id_token?: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  scope?: string;
}

const SENSITIVE_FORM_FIELDS = [
  'client_secret',
  'code',
  'refresh_token',
  'access_token',
];

function redactRequestBody(body: string): string {
  try {
    const params = new URLSearchParams(body);
    for (const field of SENSITIVE_FORM_FIELDS) {
      if (params.has(field)) params.set(field, '<redacted>');
    }
    return params.toString();
  } catch {
    return '<redacted>';
  }
}

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

/** Decode a JWT payload without verifying its signature.
 *
 * Enough to read the `nonce` claim for replay binding. This intentionally does
 * not validate the signature or any registered claim — the demo runs against a
 * local emulator with fake credentials. */
function decodeJwtPayload(token: string): Record<string, unknown> | undefined {
  const segment = token.split('.')[1];
  if (!segment) return undefined;

  try {
    const json = Buffer.from(segment, 'base64url').toString('utf8');
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

@Injectable()
export class GoogleAuthEmulateStrategy extends PassportStrategy(
  Strategy,
  'google-emulate',
  // passport-oauth2 forwards the raw token response to the verify callback only
  // when it declares 5 parameters, and additionally prepends `req` (arity 6) when
  // `passReqToCallback` is set. The Nest mixin wraps validate() in a variadic
  // callback (length 0), so pin the wrapper's length to 6 to reach that branch.
  6
) {
  private readonly logger = new Logger(GoogleAuthEmulateStrategy.name);
  private readonly userInfoUrl: string;
  private readonly stateStore: InMemoryOAuthStateStore;

  constructor(
    private readonly googleAuthEmulateService: GoogleAuthEmulateService
  ) {
    const port =
      process.env['GOOGLE_EMULATOR_PORT'] ||
      String(DEFAULT_GOOGLE_EMULATOR_PORT);
    const emulatorBaseUrl =
      process.env['GOOGLE_EMULATOR_URL'] || `http://localhost:${port}`;

    const userInfoUrl =
      process.env['GOOGLE_USERINFO_URL'] ||
      `${emulatorBaseUrl}/oauth2/v2/userinfo`;

    // Created before super() because class field initializers run after it, so
    // the same instance can be both handed to passport-oauth2 and kept for the
    // nonce lookup in validate().
    const stateStore = new InMemoryOAuthStateStore();

    super({
      clientID:
        process.env['GOOGLE_CLIENT_ID'] ||
        'example-client-id.apps.googleusercontent.com',
      clientSecret:
        process.env['GOOGLE_CLIENT_SECRET'] || 'GOCSPX-example_secret',
      callbackURL:
        process.env['GOOGLE_CALLBACK_URL'] ||
        'http://localhost:3000/api/google-auth-emulate/callback',
      scope: ['openid', 'profile', 'email'],
      authorizationURL:
        process.env['GOOGLE_AUTH_URL'] || `${emulatorBaseUrl}/o/oauth2/v2/auth`,
      tokenURL:
        process.env['GOOGLE_TOKEN_URL'] || `${emulatorBaseUrl}/oauth2/token`,
      // Pass userProfileURL to satisfy the strategy config, but we override
      // the userProfile() method below to fetch with a proper Bearer header.
      userProfileURL: userInfoUrl,
      // Without a `store`/`state`/`pkce` option passport-oauth2 uses a NullStore,
      // which sends no `state` and correlates nothing on the callback. The cast
      // is needed because @types/passport-oauth2 only declares the 2-/3-arity
      // StateStore overloads, while the runtime dispatches on Function.length.
      store: stateStore as unknown as OAuth2.StateStore,
      passReqToCallback: true,
    });

    // Store for use in the overridden userProfile()
    this.userInfoUrl = userInfoUrl;
    this.stateStore = stateStore;

    // The token exchange is performed internally by passport-google-oauth20
    // (oauth2.getOAuthAccessToken -> this._oauth2._request). Wrap the client's
    // _request so the API inspector captures the real token POST alongside the
    // userinfo GET logged in userProfile(), instead of synthesizing a fake row.
    this.interceptOAuth2Request();
  }

  /**
   * Add a per-request OIDC `nonce` to the authorization URL and hand the same
   * value to the state store.
   *
   * passport-oauth2 calls authorizationParams() *before* it reads
   * `options.state`, so setting `options.state` to an object here routes the
   * request through the state store (a string state would bypass it), and the
   * nonce returned in the params rides along as a query parameter. The store
   * then persists `{ nonce }` under the generated `state` handle.
   */
  override authorizationParams(options: Record<string, unknown>): object {
    const nonce = randomUUID();
    options.state = { nonce };

    return { ...super.authorizationParams(options), nonce };
  }

  private interceptOAuth2Request(): void {
    const oauth2 = this._oauth2 as unknown as OAuth2RequestClient;
    const originalRequest = oauth2._request.bind(oauth2);

    oauth2._request = (method, url, headers, postBody, accessToken, cb) => {
      const startTime = Date.now();

      const requestHeaders: Record<string, string> = {};
      if (headers) {
        for (const [key, value] of Object.entries(headers)) {
          if (typeof value === 'string') requestHeaders[key] = value;
        }
      }
      if (accessToken) {
        requestHeaders['Authorization'] = `Bearer ${accessToken.slice(
          0,
          15
        )}...`;
      }

      const wrappedCallback = (
        err?: unknown,
        data?: unknown,
        response?: unknown
      ) => {
        const latencyMs = Date.now() - startTime;
        if (err) {
          const errObj = err as {
            statusCode?: number;
            data?: unknown;
            message?: string;
          };
          this.logApiCall({
            method: String(method),
            url,
            statusCode: errObj.statusCode || 500,
            requestHeaders,
            // Never log the raw body: it carries client_secret, code, tokens.
            requestBody:
              postBody && typeof postBody === 'string'
                ? redactRequestBody(postBody)
                : undefined,
            responseHeaders: {},
            responseBody: JSON.stringify(
              errObj.data ?? { error: errObj.message || String(err) },
              null,
              2
            ),
            latencyMs,
          });
        } else {
          const parsedBody =
            typeof data === 'string' ? safeJsonParse(data) : data;
          this.logApiCall({
            method: String(method),
            url,
            statusCode: 200,
            requestHeaders,
            requestBody:
              postBody && typeof postBody === 'string'
                ? redactRequestBody(postBody)
                : undefined,
            responseHeaders: {},
            responseBody: JSON.stringify(parsedBody ?? {}, null, 2),
            latencyMs,
          });
        }
        if (typeof cb === 'function') {
          // Forward the original arguments (err, data, response) unchanged.
          cb(err, data as string | undefined, response);
        }
      };

      return originalRequest(
        method,
        url,
        headers,
        postBody,
        accessToken ?? null,
        wrappedCallback
      );
    };
  }

  private logApiCall(entry: Omit<ApiLogEntryDto, 'id' | 'timestamp'>): void {
    this.googleAuthEmulateService.appendLog(entry);
  }

  /**
   * Override passport-google-oauth20's built-in userProfile() which sends
   * the access token as a query param (?access_token=...). The Vercel Labs
   * Google emulator only accepts Bearer token auth on the userinfo endpoint,
   * so we fetch it manually with the correct Authorization header.
   */
  override userProfile(
    accessToken: string,
    done: (err: Error | null, profile?: Profile) => void
  ): void {
    const startTime = Date.now();
    const redactedAuth = `Bearer ${accessToken.slice(0, 15)}...`;

    axios
      .get<Record<string, unknown>>(this.userInfoUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .then((res) => {
        this.logApiCall({
          method: 'GET',
          url: this.userInfoUrl,
          statusCode: res.status,
          requestHeaders: { Authorization: redactedAuth },
          responseHeaders: res.headers as Record<string, string>,
          responseBody: JSON.stringify(res.data, null, 2),
          latencyMs: Date.now() - startTime,
        });

        const data = res.data;
        // Shape a minimal passport Profile from the OIDC userinfo response
        const profile: Profile = {
          id: String(data['sub'] ?? ''),
          displayName: String(data['name'] ?? ''),
          profileUrl: String(data['profile'] ?? ''),
          emails: data['email']
            ? [
                {
                  value: String(data['email']),
                  verified: Boolean(data['email_verified'] ?? true),
                },
              ]
            : undefined,
          photos: data['picture']
            ? [{ value: String(data['picture']) }]
            : undefined,
          provider: 'google',
          _raw: JSON.stringify(data),
          _json: data as Profile['_json'],
          name: {
            familyName: String(data['family_name'] ?? ''),
            givenName: String(data['given_name'] ?? ''),
          },
        };
        done(null, profile);
      })
      .catch((err: unknown) => {
        const errorObj = err as {
          response?: {
            status?: number;
            headers?: Record<string, string>;
            data?: unknown;
          };
        };
        this.logApiCall({
          method: 'GET',
          url: this.userInfoUrl,
          statusCode: errorObj.response?.status || 500,
          requestHeaders: { Authorization: redactedAuth },
          responseHeaders:
            (errorObj.response?.headers as Record<string, string>) || {},
          responseBody: JSON.stringify(
            errorObj.response?.data || { error: String(err) },
            null,
            2
          ),
          latencyMs: Date.now() - startTime,
        });
        this.logger.error('Failed to fetch userinfo from emulator', err);
        done(err instanceof Error ? err : new Error(String(err)));
      });
  }

  async validate(
    req: Request,
    accessToken: string,
    refreshToken: string,
    params: GoogleTokenResponseParams,
    profile: Profile
  ): Promise<unknown> {
    // Consume the pending authorization registered for this request. The state
    // store already rejected a missing/unknown `state` before we get here; this
    // is what makes it single-use and supplies the nonce to compare against.
    const state = req.query?.['state'];
    const pending = this.stateStore.consume(
      typeof state === 'string' ? state : undefined
    );

    const issuedNonce = params.id_token
      ? decodeJwtPayload(params.id_token)?.['nonce']
      : undefined;

    if (
      pending?.nonce &&
      typeof issuedNonce === 'string' &&
      issuedNonce !== pending.nonce
    ) {
      throw new UnauthorizedException(
        'OAuth nonce mismatch - possible replay attack'
      );
    }

    if (pending?.nonce && typeof issuedNonce !== 'string') {
      // The emulator is a pre-1.0 dependency; tolerate an ID token without a
      // nonce claim rather than breaking sign-in, but make the gap visible.
      this.logger.warn(
        'ID token did not include a nonce claim; skipping nonce validation'
      );
    }

    const userProfile = {
      sub: profile.id,
      email: profile.emails?.[0]?.value || '',
      name: profile.displayName || '',
      picture: profile.photos?.[0]?.value || '',
      email_verified: true,
    };

    const tokens = {
      access_token: accessToken,
      // The real signed ID token JWT arrives in the token response (params);
      // profile._json is the userinfo payload and never carries one.
      id_token: params.id_token || accessToken,
      refresh_token: refreshToken,
      expires_in: 3600,
      token_type: 'Bearer',
      scope: 'openid profile email',
    };

    this.googleAuthEmulateService.setOAuthResult(tokens, userProfile);

    // Return the user rather than calling done(): the Nest wrapper invokes the
    // verify callback itself once validate() resolves, so calling done() here
    // would run the passport success path twice.
    return { tokens, userProfile };
  }
}
