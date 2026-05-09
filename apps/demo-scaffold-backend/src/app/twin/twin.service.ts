import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { GcsTwin } from '@open-kingdom/shared-backend-integration-test-doubles';
import { GcsStorageService } from '@open-kingdom/shared-backend-feature-gcp-resources';
import { ErrorModeStateDto } from '@open-kingdom/shared-backend-feature-gcp-resources';

const DEFAULT_BUCKETS = ['app-assets', 'user-uploads'];

@Injectable()
export class TwinService implements OnModuleDestroy {
  private readonly logger = new Logger(TwinService.name);
  private twin: GcsTwin | null = null;
  private started = false;
  private readonly port = parseInt(process.env.GCS_TWIN_PORT || '9013', 10);

  constructor(private readonly gcsStorage: GcsStorageService) {}

  async start(): Promise<{ success: boolean; message: string; url?: string }> {
    // Reuse existing twin or create a new one
    if (!this.twin) {
      this.twin = new GcsTwin({ port: this.port });
    }

    try {
      await this.twin.start();
      this.started = true;
      this.logger.log(`Twin started at ${this.twin.getEmulatorHost()}`);
      return {
        success: true,
        message: `GCS twin started on port ${this.port}`,
        url: this.twin.getEmulatorHost(),
      };
    } catch (error) {
      this.started = false;
      this.logger.error('Failed to start twin', error);
      return {
        success: false,
        message: `Failed to start GCS twin: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
  }

  async stop(): Promise<{ success: boolean; message: string }> {
    // Clear error mode before stopping
    this.gcsStorage.resetErrorMode();
    this.logger.log('Error mode cleared on twin stop');

    if (!this.twin) {
      this.started = false;
      return { success: true, message: 'GCS twin was not running' };
    }

    try {
      await this.twin.stop();
      this.started = false;
      this.twin = null;
      this.logger.log('Twin stopped');
      return {
        success: true,
        message: 'GCS twin stopped',
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to stop GCS twin: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
  }

  async status(): Promise<{
    running: boolean;
    healthy: boolean;
    port: number;
    url?: string;
    errorMode: ErrorModeStateDto;
  }> {
    const errorMode = this.gcsStorage.getErrorModeState();
    if (!this.twin || !this.started) {
      return { running: false, healthy: false, port: this.port, errorMode };
    }

    try {
      const healthy = await this.twin.isHealthy();
      // If the container is gone (not healthy), update our state
      if (!healthy) {
        this.started = false;
        this.twin = null;
        return { running: false, healthy: false, port: this.port, errorMode };
      }
      return {
        running: true,
        healthy: true,
        port: this.port,
        url: this.twin.getEmulatorHost(),
        errorMode,
      };
    } catch {
      this.started = false;
      this.twin = null;
      return { running: false, healthy: false, port: this.port, errorMode };
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
