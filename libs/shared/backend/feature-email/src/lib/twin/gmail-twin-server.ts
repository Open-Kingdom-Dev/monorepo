import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  createGmailConfig,
  GmailTwinConfig,
} from './gmail-twin-server.config.js';
import { EmailStore, CapturedEmail } from './email-store.js';
import { GmailTwinServerService } from './gmail-twin-server.service.js';
import { GmailTwinServerModule } from './gmail-twin-server.module.js';
import { GmailTwinErrorMode } from '../email.types.js';

export class GmailTwinServer {
  private readonly config: GmailTwinConfig;
  private app: INestApplication | null = null;
  private service: GmailTwinServerService | null = null;

  constructor(overrides?: Partial<GmailTwinConfig>) {
    this.config = createGmailConfig(overrides);
  }

  async start(): Promise<void> {
    if (this.app) return;

    this.app = await NestFactory.create(
      GmailTwinServerModule.forRoot(this.config)
    );

    this.service = this.app.get(GmailTwinServerService);
    await this.app.listen(this.config.port);
    console.log(
      `[GmailTwinServer] NestJS server listening on port ${this.config.port}`
    );
  }

  async stop(): Promise<void> {
    if (!this.app) return;
    await this.app.close();
    this.app = null;
    this.service = null;
    console.log('[GmailTwinServer] NestJS server stopped');
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
      throw new Error('GmailTwinServer has not been started yet');
    }
    return this.service.getEmailStore();
  }

  getEmails(to?: string): CapturedEmail[] {
    if (!this.service) {
      throw new Error('GmailTwinServer has not been started yet');
    }
    return this.service.getEmails(to);
  }

  setErrorMode(mode: GmailTwinErrorMode | null): void {
    if (!this.service) {
      throw new Error('GmailTwinServer has not been started yet');
    }
    this.service.setErrorMode(mode);
  }

  getErrorMode(): GmailTwinErrorMode | null {
    if (!this.service) {
      throw new Error('GmailTwinServer has not been started yet');
    }
    return this.service.getErrorMode();
  }

  getEmulatorHost(): string {
    return this.config.externalUrl;
  }
}
