import { Injectable } from '@nestjs/common';
import { EmailStore, CapturedEmail } from './email-store.js';

@Injectable()
export class GmailTwinService {
  private readonly emailStore = new EmailStore();

  getEmailStore(): EmailStore {
    return this.emailStore;
  }

  async sendEmail(raw: string): Promise<CapturedEmail> {
    return this.emailStore.capture(raw);
  }

  getEmails(to?: string): CapturedEmail[] {
    return this.emailStore.query(to);
  }

  reset(): void {
    this.emailStore.clear();
  }
}
