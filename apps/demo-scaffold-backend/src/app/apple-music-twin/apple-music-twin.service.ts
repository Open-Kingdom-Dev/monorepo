import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { AppleMusicTwin } from '@open-kingdom/shared-backend-integration-test-doubles';

@Injectable()
export class AppleMusicTwinService implements OnModuleDestroy {
  private readonly logger = new Logger(AppleMusicTwinService.name);
  private twin: AppleMusicTwin | null = null;
  private started = false;
  private readonly port = parseInt(
    process.env.APPLE_MUSIC_TWIN_PORT || '9019',
    10
  );

  async start(): Promise<{ success: boolean; message: string; url?: string }> {
    if (!this.twin) {
      this.twin = new AppleMusicTwin({ port: this.port });
    }

    try {
      await this.twin.start();
      this.started = true;
      this.logger.log(
        `Apple Music twin started at ${this.twin.getEmulatorHost()}`
      );
      return {
        success: true,
        message: `Apple Music twin started on port ${this.port}`,
        url: this.twin.getEmulatorHost(),
      };
    } catch (error) {
      this.started = false;
      this.logger.error('Failed to start Apple Music twin', error);
      return {
        success: false,
        message: `Failed to start Apple Music twin: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
  }

  async stop(): Promise<{ success: boolean; message: string }> {
    if (!this.twin) {
      this.started = false;
      return { success: true, message: 'Apple Music twin was not running' };
    }

    try {
      await this.twin.stop();
      this.started = false;
      this.twin = null;
      this.logger.log('Apple Music twin stopped');
      return {
        success: true,
        message: 'Apple Music twin stopped',
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to stop Apple Music twin: ${
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
    errorMode: { active: boolean; mode: string | null };
  }> {
    if (!this.twin || !this.started) {
      return {
        running: false,
        healthy: false,
        port: this.port,
        errorMode: { active: false, mode: null },
      };
    }

    try {
      const healthy = await this.twin.isHealthy();
      if (!healthy) {
        this.started = false;
        this.twin = null;
        return {
          running: false,
          healthy: false,
          port: this.port,
          errorMode: { active: false, mode: null },
        };
      }

      // Fetch active error mode from the twin server itself
      let errorMode: { active: boolean; mode: string | null } = {
        active: false,
        mode: null,
      };
      try {
        const res = await fetch(
          `${this.twin.getEmulatorHost()}/test/apple-music/error-mode`
        );
        if (res.ok) {
          errorMode = (await res.json()) as {
            active: boolean;
            mode: string | null;
          };
        }
      } catch (err) {
        this.logger.warn(
          'Failed to fetch error mode from Apple Music twin',
          err
        );
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
      return {
        running: false,
        healthy: false,
        port: this.port,
        errorMode: { active: false, mode: null },
      };
    }
  }

  async reset(): Promise<void> {
    if (this.twin) {
      await this.twin.reset();
      this.logger.log('Apple Music twin state reset');
    }
  }

  async setErrorMode(mode: string): Promise<void> {
    if (this.twin && this.started) {
      await fetch(
        `${this.twin.getEmulatorHost()}/test/apple-music/error-mode`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode }),
        }
      );
    }
  }

  async clearErrorMode(): Promise<void> {
    if (this.twin && this.started) {
      await fetch(
        `${this.twin.getEmulatorHost()}/test/apple-music/error-mode`,
        {
          method: 'DELETE',
        }
      );
    }
  }

  async onModuleDestroy() {
    await this.stop().catch(() => {
      /* ignore cleanup errors */
    });
  }
}
