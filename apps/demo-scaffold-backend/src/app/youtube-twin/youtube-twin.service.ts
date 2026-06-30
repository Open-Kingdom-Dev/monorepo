import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { YoutubeTwin } from '@open-kingdom/shared-backend-integration-test-doubles';
import { YoutubeSearchService } from '@open-kingdom/shared-backend-feature-youtube';
import { YoutubeErrorModeStateDto } from '@open-kingdom/shared-backend-feature-youtube';

@Injectable()
export class YouTubeTwinService implements OnModuleDestroy {
  private readonly logger = new Logger(YouTubeTwinService.name);
  private twin: YoutubeTwin | null = null;
  private started = false;
  private readonly port = parseInt(process.env.YOUTUBE_TWIN_PORT || '9016', 10);

  constructor(private readonly youtubeSearchService: YoutubeSearchService) {}

  async start(): Promise<{ success: boolean; message: string; url?: string }> {
    if (!this.twin) {
      this.twin = new YoutubeTwin({ port: this.port });
    }

    try {
      await this.twin.start();
      this.started = true;
      this.logger.log(`YouTube twin started at ${this.twin.getEmulatorHost()}`);
      return {
        success: true,
        message: `YouTube twin started on port ${this.port}`,
        url: this.twin.getEmulatorHost(),
      };
    } catch (error) {
      this.started = false;
      this.logger.error('Failed to start YouTube twin', error);
      return {
        success: false,
        message: `Failed to start YouTube twin: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
  }

  async stop(): Promise<{ success: boolean; message: string }> {
    // Clear error mode before stopping
    await this.youtubeSearchService.resetErrorMode();
    this.logger.log('YouTube twin error mode cleared on stop');

    if (!this.twin) {
      this.started = false;
      return { success: true, message: 'YouTube twin was not running' };
    }

    try {
      await this.twin.stop();
      this.started = false;
      this.twin = null;
      this.logger.log('YouTube twin stopped');
      return {
        success: true,
        message: 'YouTube twin stopped',
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to stop YouTube twin: ${
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
    errorMode: YoutubeErrorModeStateDto;
  }> {
    const errorMode = await this.youtubeSearchService.getErrorModeState();
    if (!this.twin || !this.started) {
      return { running: false, healthy: false, port: this.port, errorMode };
    }

    try {
      const healthy = await this.twin.isHealthy();
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

  async reset(): Promise<void> {
    await this.youtubeSearchService.resetErrorMode();
    this.logger.log('YouTube twin error mode cleared on reset');

    if (this.twin) {
      await this.twin.reset();
      this.logger.log('YouTube twin state reset');
    }
  }

  async onModuleDestroy() {
    await this.stop().catch(() => {
      /* ignore cleanup errors */
    });
  }
}
