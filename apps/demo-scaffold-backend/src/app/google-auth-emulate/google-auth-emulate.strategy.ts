import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import axios from 'axios';
import {
  GoogleAuthEmulateService,
  DEFAULT_GOOGLE_EMULATOR_PORT,
} from './google-auth-emulate.service';
import { ApiLogEntryDto } from './google-auth-emulate.dto';

@Injectable()
export class GoogleAuthEmulateStrategy extends PassportStrategy(
  Strategy,
  'google-emulate'
) {
  private readonly logger = new Logger(GoogleAuthEmulateStrategy.name);
  private readonly userInfoUrl: string;
  private readonly tokenUrl: string;

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

    const tokenUrl =
      process.env['GOOGLE_TOKEN_URL'] || `${emulatorBaseUrl}/oauth2/token`;

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
    this.tokenUrl = tokenUrl;
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
    profile: Profile,
    done: VerifyCallback
  ): Promise<unknown> {
    const rawJson = (profile as Profile & { _json?: { id_token?: string } })
      ._json;

    const userProfile = {
      sub: profile.id,
      email: profile.emails?.[0]?.value || '',
      name: profile.displayName || '',
      picture: profile.photos?.[0]?.value || '',
      email_verified: true,
    };

    const tokens = {
      access_token: accessToken,
      id_token: rawJson?.id_token || accessToken,
      refresh_token: refreshToken,
      expires_in: 3600,
      token_type: 'Bearer',
      scope: 'openid profile email',
    };

    // The token exchange is performed internally by passport-google-oauth20
    // (oauth2.getOAuthAccessToken). Capture it here so the API inspector sees
    // the token POST alongside the userinfo GET logged in userProfile().
    const tokenStartTime = Date.now();
    this.logApiCall({
      method: 'POST',
      url: this.tokenUrl,
      statusCode: 200,
      requestHeaders: { 'Content-Type': 'application/x-www-form-urlencoded' },
      requestBody:
        'grant_type=authorization_code&client_id=<redacted>&redirect_uri=<redacted>&code=<redacted>',
      responseBody: JSON.stringify(
        { access_token: `${accessToken.slice(0, 15)}...`, token_type: 'Bearer' },
        null,
        2
      ),
      latencyMs: Date.now() - tokenStartTime,
    });

    this.googleAuthEmulateService.setOAuthResult(tokens, userProfile);

    const user = { tokens, userProfile };
    done(null, user);
    return user;
  }
}
