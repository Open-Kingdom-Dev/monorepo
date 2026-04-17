import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { GcsTwin } from '@open-kingdom/shared-backend-integration-test-doubles';

@Injectable()
export class TwinService implements OnModuleDestroy {
  private twin: GcsTwin | null = null;
  private readonly port = parseInt(process.env.GCS_TWIN_PORT || '9013', 10);

  constructor() {
    this.twin = new GcsTwin({ port: this.port });
  }

  async start(): Promise<{ success: boolean; message: string; url?: string }> {
    try {
      await this.twin?.start();
      return {
        success: true,
        message: `GCS twin started on port ${this.port}`,
        url: this.twin?.getEmulatorHost(),
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to start GCS twin: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  async stop(): Promise<{ success: boolean; message: string }> {
    try {
      await this.twin?.stop();
      return {
        success: true,
        message: 'GCS twin stopped',
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to stop GCS twin: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  async status(): Promise<{
    running: boolean;
    healthy: boolean;
    port: number;
    url?: string;
  }> {
    const twin = this.twin;
    if (!twin) {
      return { running: false, healthy: false, port: this.port };
    }
    try {
      const healthy = await twin.isHealthy();
      return {
        running: true,
        healthy,
        port: this.port,
        url: twin.getEmulatorHost(),
      };
    } catch {
      return { running: false, healthy: false, port: this.port };
    }
  }

  async onModuleDestroy() {
    await this.stop().catch(() => {});
  }
}