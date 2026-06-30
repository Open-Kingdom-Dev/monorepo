import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import {
  GcsTwin,
  NodeInterceptor,
  RoutingTable,
  defaultRoutingEntries,
} from '@open-kingdom/shared-backend-integration-test-doubles';
import {
  GcsStorageService,
  ErrorModeStateDto,
} from '@open-kingdom/shared-backend-feature-gcp-resources';
import { GmailTwinServer } from '@open-kingdom/shared-backend-feature-email/twin';

const DEFAULT_BUCKETS = ['app-assets', 'user-uploads'];

@Injectable()
export class TwinService implements OnModuleDestroy {
  private readonly logger = new Logger(TwinService.name);
  private gcsTwin: GcsTwin | null = null;
  private gmailTwin: GmailTwinServer | null = null;
  private interceptor: NodeInterceptor | null = null;
  private started = false;

  private readonly gcsPort = parseInt(process.env.GCS_TWIN_PORT || '9013', 10);
  private readonly gmailPort = parseInt(
    process.env.GMAIL_TWIN_PORT || '9014',
    10
  );

  constructor(private readonly gcsStorage: GcsStorageService) {}

  async start(): Promise<{ success: boolean; message: string; url?: string }> {
    // 1. Initialize twins if not present
    if (!this.gcsTwin) {
      this.gcsTwin = new GcsTwin({ port: this.gcsPort });
    }
    if (!this.gmailTwin) {
      this.gmailTwin = new GmailTwinServer({ port: this.gmailPort });
    }

    try {
      // 2. Start GCS Twin
      try {
        await this.gcsTwin.start();
      } catch (err) {
        this.logger.warn(
          `Failed to start GCS Twin (Docker might not be running). GCS mock will be unavailable. Details: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
      }

      // 3. Start Gmail REST Twin
      await this.gmailTwin.start();

      // 4. Install Global Fetch Interceptor
      if (!this.interceptor) {
        const table = new RoutingTable([
          ...defaultRoutingEntries.map((entry) => {
            if (entry.hostname === 'gmail.googleapis.com') {
              return { ...entry, target: `http://localhost:${this.gmailPort}` };
            }
            return entry;
          }),
          {
            hostname: 'oauth2.googleapis.com',
            target: `http://localhost:${this.gmailPort}`,
          },
        ]);
        this.interceptor = new NodeInterceptor(table);
      }
      this.interceptor.install();

      this.started = true;
      this.logger.log(
        `Twins started. GCS: ${this.gcsTwin.getEmulatorHost()} | Gmail: ${this.gmailTwin.getEmulatorHost()}`
      );

      return {
        success: true,
        message: `GCS twin started on port ${this.gcsPort}. Gmail twin started on port ${this.gmailPort}. Interceptor active.`,
        url: this.gcsTwin.getEmulatorHost(),
      };
    } catch (error) {
      this.started = false;
      this.logger.error('Failed to start twin environment', error);
      await this.stop().catch(() => {
        /* ignore cleanup error on failure */
      });
      return {
        success: false,
        message: `Failed to start twin environment: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
  }

  async stop(): Promise<{ success: boolean; message: string }> {
    // Clear error mode before stopping
    this.gcsStorage.resetErrorMode();
    this.logger.log('Error mode cleared on twin stop');

    if (!this.gcsTwin && !this.gmailTwin) {
      this.started = false;
      return { success: true, message: 'Twin environment was not running' };
    }
    try {
      // 1. Uninstall Interceptor
      if (this.interceptor) {
        this.interceptor.uninstall();
        this.interceptor = null;
      }

      // 2. Stop GCS Twin
      if (this.gcsTwin) {
        await this.gcsTwin.stop();
        this.gcsTwin = null;
      }

      // 3. Stop Gmail Twin
      if (this.gmailTwin) {
        await this.gmailTwin.stop();
        this.gmailTwin = null;
      }

      this.started = false;
      this.logger.log('Twin environment stopped cleanly');
      return {
        success: true,
        message: 'Twin environment stopped successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to stop twin environment: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
  }

  isRealGmailConfigured(): boolean {
    const clientEmail = process.env['GMAIL_CLIENT_EMAIL'];
    const privateKey = process.env['GMAIL_PRIVATE_KEY'];
    const impersonateEmail = process.env['GMAIL_IMPERSONATE_EMAIL'];

    if (!clientEmail || !privateKey || !impersonateEmail) {
      return false;
    }

    // Check for obvious dev/mock default patterns
    const isMockClient =
      clientEmail.includes('mock') || clientEmail.includes('test');
    const isMockImpersonate =
      impersonateEmail.includes('test') || impersonateEmail.includes('example');
    const isMockKey =
      privateKey.includes('test') ||
      privateKey.includes(
        'MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC3'
      );

    if (isMockClient || isMockImpersonate || isMockKey) {
      return false;
    }

    return true;
  }

  async status(): Promise<{
    running: boolean;
    healthy: boolean;
    port: number;
    url?: string;
    gcsOnline?: boolean;
    errorMode: ErrorModeStateDto;
    gmail?: { running: boolean; healthy: boolean; port: number; url?: string };
    interceptorActive: boolean;
    realGmailConfigured: boolean;
  }> {
    const errorMode = this.gcsStorage.getErrorModeState();
    const realGmailConfigured = this.isRealGmailConfigured();

    if (!this.started || !this.gcsTwin || !this.gmailTwin) {
      return {
        running: false,
        healthy: false,
        port: this.gcsPort,
        gcsOnline: false,
        errorMode,
        interceptorActive: false,
        realGmailConfigured,
      };
    }

    try {
      const gcsHealthy = await this.gcsTwin.isHealthy();
      const gmailHealthy = await this.gmailTwin.isHealthy();

      // Only shutdown environment if Gmail is unhealthy (GCS offline is allowed)
      if (!gmailHealthy) {
        this.gmailTwin = null;
        this.started = false;
      }

      return {
        running: this.started,
        healthy: gcsHealthy && gmailHealthy,
        port: this.gcsPort,
        url: this.gcsTwin ? this.gcsTwin.getEmulatorHost() : undefined,
        gcsOnline: gcsHealthy,
        errorMode,
        gmail: {
          running: this.started,
          healthy: gmailHealthy,
          port: this.gmailPort,
          url: this.gmailTwin ? this.gmailTwin.getEmulatorHost() : undefined,
        },
        interceptorActive: this.interceptor
          ? this.interceptor.isActive()
          : false,
        realGmailConfigured,
      };
    } catch {
      this.started = false;
      this.gcsTwin = null;
      this.gmailTwin = null;
      return {
        running: false,
        healthy: false,
        port: this.gcsPort,
        gcsOnline: false,
        errorMode,
        interceptorActive: false,
        realGmailConfigured,
      };
    }
  }

  async getGmailEmails() {
    if (!this.gmailTwin) return [];
    return this.gmailTwin.getEmails();
  }

  async resetGmail() {
    if (this.gmailTwin) {
      await this.gmailTwin.reset();
    }
  }

  async setGmailErrorMode(
    mode: 'insufficient-permissions' | 'rate-limit' | 'invalid-recipient' | null
  ) {
    if (this.gmailTwin) {
      this.gmailTwin.setErrorMode(mode);
    }
  }

  /**
   * Reset twin data and clear error mode state.
   * Uses GcsStorageService (official SDK) instead of raw fetch —
   * routes to emulator automatically when configured.
   */
  async reset(): Promise<void> {
    this.gcsStorage.resetErrorMode();
    this.logger.log('Error mode cleared on twin reset');

    await this.gcsStorage.resetBuckets(DEFAULT_BUCKETS);
  }

  async onModuleDestroy() {
    await this.stop().catch(() => {
      /* ignore cleanup errors */
    });
  }
}
