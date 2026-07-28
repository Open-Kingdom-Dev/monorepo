import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import axios from 'axios';
import {
  GoogleAuthEmulateService,
  DEFAULT_GOOGLE_EMULATOR_PORT,
} from './google-auth-emulate.service';

@Injectable()
export class GoogleAuthEmulateStrategy extends PassportStrategy(
  Strategy,
  'google-emulate'
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
    axios
      .get<Record<string, unknown>>(this.userInfoUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .then((res) => {
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

    this.googleAuthEmulateService.setOAuthResult(tokens, userProfile);

    const user = { tokens, userProfile };
    done(null, user);
    return user;
  }
}
