import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { GcsTwin } from '@open-kingdom/shared-backend-integration-test-doubles';

@Injectable()
export class TwinService implements OnModuleDestroy {
  private readonly logger = new Logger(TwinService.name);
  private twin: GcsTwin | null = null;
  private started = false;
  private readonly port = parseInt(process.env.GCS_TWIN_PORT || '9013', 10);

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
  }> {
    if (!this.twin || !this.started) {
      return { running: false, healthy: false, port: this.port };
    }

    try {
      const healthy = await this.twin.isHealthy();
      // If the container is gone (not healthy), update our state
      if (!healthy) {
        this.started = false;
        this.twin = null;
        return { running: false, healthy: false, port: this.port };
      }
      return {
        running: true,
        healthy: true,
        port: this.port,
        url: this.twin.getEmulatorHost(),
      };
    } catch {
      this.started = false;
      this.twin = null;
      return { running: false, healthy: false, port: this.port };
    }
  }

  async onModuleDestroy() {
    await this.stop().catch(() => {
      /* ignore cleanup errors */
    });
  }
}
