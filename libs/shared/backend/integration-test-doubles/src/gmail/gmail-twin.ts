import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { createGmailConfig, GmailTwinConfig } from './gmail-twin.config.js';
import { EmailStore } from './email-store.js';
import { GmailTwinService } from './gmail-twin.service.js';
import { GmailTwinModule } from './gmail-twin.module.js';

export class GmailTwin {
  private readonly config: GmailTwinConfig;
  private app: INestApplication | null = null;
  private service: GmailTwinService | null = null;

  constructor(overrides?: Partial<GmailTwinConfig>) {
    this.config = createGmailConfig(overrides);
  }

  async start(): Promise<void> {
    if (this.app) return;

    this.app = await NestFactory.create(GmailTwinModule);

    this.service = this.app.get(GmailTwinService);
    await this.app.listen(this.config.port);
    console.log(
      `[GmailTwin] NestJS server listening on port ${this.config.port}`
    );
  }

  async stop(): Promise<void> {
    if (!this.app) return;
    await this.app.close();
    this.app = null;
    this.service = null;
    console.log('[GmailTwin] NestJS server stopped');
  }

  async reset(): Promise<void> {
    if (this.service) {
      this.service.reset();
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const res = await fetch(`${this.config.externalUrl}/test/gmail/health`);
      return res.ok;
    } catch {
      return false;
    }
  }

  getEmailStore(): EmailStore {
    if (!this.service) {
      throw new Error('GmailTwin has not been started yet');
    }
    return this.service.getEmailStore();
  }

  getEmulatorHost(): string {
    return this.config.externalUrl;
  }
}
