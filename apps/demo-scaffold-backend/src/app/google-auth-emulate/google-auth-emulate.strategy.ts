import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import axios from 'axios';
import { ApiLogEntryDto } from './google-auth-emulate.dto';
import {
  GoogleAuthEmulateService,
  DEFAULT_GOOGLE_EMULATOR_PORT,
} from './google-auth-emulate.service';

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

@Injectable()
export class GoogleAuthEmulateStrategy extends PassportStrategy(
  Strategy,
  'google-emulate',
  // passport-oauth2 forwards the raw token response to the verify callback
  // only when it declares 5 parameters. The Nest mixin wraps validate() in a
  // variadic callback (length 0), so pin the wrapper's length to 5.
  5
) {
  private readonly logger = new Logger(GoogleAuthEmulateStrategy.name);
  private readonly userInfoUrl: string;

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
    });

    // Store for use in the overridden userProfile()
    this.userInfoUrl = userInfoUrl;

    // The token exchange is performed internally by passport-google-oauth20
    // (oauth2.getOAuthAccessToken -> this._oauth2._request). Wrap the client's
    // _request so the API inspector captures the real token POST alongside the
    // userinfo GET logged in userProfile(), instead of synthesizing a fake row.
    this.interceptOAuth2Request();
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
    accessToken: string,
    refreshToken: string,
    params: GoogleTokenResponseParams,
    profile: Profile,
    done: VerifyCallback
  ): Promise<unknown> {
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

    const user = { tokens, userProfile };
    done(null, user);
    return user;
  }
}
