import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import type { Emulator } from 'emulate';
import axios from 'axios';
import {
  GoogleEmulatorStatusDto,
  GoogleOAuthResultDto,
  ApiLogEntryDto,
  GoogleOAuthTokensDto,
  GoogleUserProfileDto,
} from './google-auth-emulate.dto';

export const DEFAULT_GOOGLE_EMULATOR_PORT = 9015;

export const DEFAULT_GOOGLE_SEED_CONFIG = {
  google: {
    users: [
      {
        email: 'testuser@example.com',
        name: 'Test User',
        picture: 'https://lh3.googleusercontent.com/a/default-user',
        email_verified: true,
      },
    ],
    oauth_clients: [
      {
        client_id: 'example-client-id.apps.googleusercontent.com',
        client_secret: 'GOCSPX-example_secret',
        name: 'Code App (Google)',
        redirect_uris: [
          'http://localhost:3000/api/google-auth-emulate/callback',
        ],
      },
    ],
  },
};

@Injectable()
export class GoogleAuthEmulateService implements OnModuleDestroy {
  private readonly logger = new Logger(GoogleAuthEmulateService.name);
  private emulator: Emulator | null = null;
  private readonly port = parseInt(
    process.env['GOOGLE_EMULATOR_PORT'] || String(DEFAULT_GOOGLE_EMULATOR_PORT),
    10
  );
  private apiLogs: ApiLogEntryDto[] = [];
  private lastOAuthResult: GoogleOAuthResultDto | null = null;

  async start(): Promise<{ success: boolean; message: string; url?: string }> {
    if (this.emulator) {
      return {
        success: true,
        message: `Google emulator is already running on port ${this.port}`,
        url: this.emulator.url,
      };
    }

    try {
      const { createEmulator } = await (eval('import("emulate")') as Promise<
        typeof import('emulate')
      >);

      this.emulator = await createEmulator({
        service: 'google',
        port: this.port,
        seed: DEFAULT_GOOGLE_SEED_CONFIG,
      });

      this.logger.log(`Google emulator started at ${this.emulator.url}`);
      return {
        success: true,
        message: `Google emulator started successfully on port ${this.port}`,
        url: this.emulator.url,
      };
    } catch (error) {
      this.emulator = null;
      this.logger.error('Failed to start Google emulator', error);
      return {
        success: false,
        message: `Failed to start Google emulator: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
  }

  async stop(): Promise<{ success: boolean; message: string }> {
    if (!this.emulator) {
      return { success: true, message: 'Google emulator was not running' };
    }

    try {
      await this.emulator.close();
      this.emulator = null;
      this.logger.log('Google emulator stopped cleanly');
      return { success: true, message: 'Google emulator stopped successfully' };
    } catch (error) {
      this.emulator = null;
      return {
        success: false,
        message: `Failed to stop Google emulator: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
  }

  async reset(): Promise<{ success: boolean; message: string }> {
    if (this.emulator) {
      this.emulator.reset();
    }
    this.apiLogs = [];
    this.lastOAuthResult = null;
    return { success: true, message: 'Google emulator state and logs reset' };
  }

  async status(): Promise<GoogleEmulatorStatusDto> {
    if (!this.emulator) {
      return {
        running: false,
        healthy: false,
        port: this.port,
      };
    }

    try {
      // Check health endpoint or port availability
      const url = this.emulator.url;
      const res = await axios.get(`${url}/.well-known/openid-configuration`, {
        timeout: 1500,
        validateStatus: () => true,
      });
      const healthy = res.status === 200;

      return {
        running: true,
        healthy,
        port: this.port,
        url,
      };
    } catch {
      return {
        running: true,
        healthy: false,
        port: this.port,
        url: this.emulator.url,
      };
    }
  }

  getAuthorizationUrl(): string {
    const baseUrl = this.emulator?.url || `http://localhost:${this.port}`;
    const clientId = 'example-client-id.apps.googleusercontent.com';
    const redirectUri = encodeURIComponent(
      'http://localhost:3000/api/google-auth-emulate/callback'
    );
    const scope = encodeURIComponent('openid profile email');
    return `${baseUrl}/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline`;
  }

  async handleCallback(code: string): Promise<GoogleOAuthResultDto> {
    const emulatorUrl = this.emulator?.url || `http://localhost:${this.port}`;
    const clientId = 'example-client-id.apps.googleusercontent.com';
    const clientSecret = 'GOCSPX-example_secret';
    const redirectUri =
      'http://localhost:3000/api/google-auth-emulate/callback';

    // 1. Exchange auth code for tokens
    const tokenStartTime = Date.now();
    const tokenUrl = `${emulatorUrl}/oauth2/token`;
    const tokenRequestBody = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }).toString();

    let tokens: GoogleOAuthTokensDto;
    try {
      const tokenRes = await axios.post(tokenUrl, tokenRequestBody, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      const tokenLatency = Date.now() - tokenStartTime;

      this.logApiCall({
        method: 'POST',
        url: tokenUrl,
        statusCode: tokenRes.status,
        requestHeaders: { 'Content-Type': 'application/x-www-form-urlencoded' },
        requestBody: tokenRequestBody,
        responseHeaders: tokenRes.headers as Record<string, string>,
        responseBody: JSON.stringify(tokenRes.data, null, 2),
        latencyMs: tokenLatency,
      });

      tokens = tokenRes.data as GoogleOAuthTokensDto;
    } catch (err: unknown) {
      const errorObj = err as {
        response?: {
          status?: number;
          headers?: Record<string, string>;
          data?: unknown;
        };
      };
      this.logApiCall({
        method: 'POST',
        url: tokenUrl,
        statusCode: errorObj.response?.status || 500,
        requestHeaders: { 'Content-Type': 'application/x-www-form-urlencoded' },
        requestBody: tokenRequestBody,
        responseHeaders:
          (errorObj.response?.headers as Record<string, string>) || {},
        responseBody: JSON.stringify(
          errorObj.response?.data || { error: String(err) },
          null,
          2
        ),
        latencyMs: Date.now() - tokenStartTime,
      });
      throw err;
    }

    // 2. Fetch User Profile
    const userinfoStartTime = Date.now();
    const userinfoUrl = `${emulatorUrl}/oauth2/v2/userinfo`;
    let userProfile: GoogleUserProfileDto;
    try {
      const userinfoRes = await axios.get(userinfoUrl, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const userinfoLatency = Date.now() - userinfoStartTime;

      this.logApiCall({
        method: 'GET',
        url: userinfoUrl,
        statusCode: userinfoRes.status,
        requestHeaders: {
          Authorization: `Bearer ${tokens.access_token.slice(0, 15)}...`,
        },
        responseHeaders: userinfoRes.headers as Record<string, string>,
        responseBody: JSON.stringify(userinfoRes.data, null, 2),
        latencyMs: userinfoLatency,
      });

      userProfile = userinfoRes.data as GoogleUserProfileDto;
    } catch (err: unknown) {
      const errorObj = err as {
        response?: {
          status?: number;
          headers?: Record<string, string>;
          data?: unknown;
        };
      };
      this.logApiCall({
        method: 'GET',
        url: userinfoUrl,
        statusCode: errorObj.response?.status || 500,
        requestHeaders: {
          Authorization: `Bearer ${tokens.access_token.slice(0, 15)}...`,
        },
        responseHeaders:
          (errorObj.response?.headers as Record<string, string>) || {},
        responseBody: JSON.stringify(
          errorObj.response?.data || { error: String(err) },
          null,
          2
        ),
        latencyMs: Date.now() - userinfoStartTime,
      });
      throw err;
    }

    const result: GoogleOAuthResultDto = {
      tokens,
      userProfile,
      apiLogs: [...this.apiLogs],
    };

    this.lastOAuthResult = result;
    return result;
  }

  getLogs(): ApiLogEntryDto[] {
    return this.apiLogs;
  }

  getLastOAuthResult(): GoogleOAuthResultDto | null {
    return this.lastOAuthResult;
  }

  async logout(): Promise<{ success: boolean; message: string }> {
    this.lastOAuthResult = null;
    return {
      success: true,
      message: 'Google OAuth session cleared successfully',
    };
  }

  private logApiCall(entry: Omit<ApiLogEntryDto, 'id' | 'timestamp'>) {
    const logEntry: ApiLogEntryDto = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    this.apiLogs.unshift(logEntry);
  }

  async onModuleDestroy() {
    await this.stop().catch(() => {
      /* ignore cleanup error */
    });
  }
}
