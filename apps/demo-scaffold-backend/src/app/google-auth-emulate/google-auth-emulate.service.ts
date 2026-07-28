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
      // ESM-only package in a CJS NestJS environment: plain await import('emulate')
      // downlevels to require() during compilation and throws ERR_REQUIRE_ESM.
      // Use eval to preserve native dynamic import in CJS output.
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

  setOAuthResult(
    tokens: GoogleOAuthTokensDto,
    userProfile: GoogleUserProfileDto
  ): GoogleOAuthResultDto {
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

  async onModuleDestroy() {
    await this.stop().catch(() => {
      /* ignore cleanup error */
    });
  }
}
