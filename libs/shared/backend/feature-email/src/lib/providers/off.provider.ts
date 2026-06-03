import { EmailMessage, EmailResult, EmailProvider } from '../email.types.js';

/**
 * A provider that discards emails silently.
 * Useful when email sending should be disabled (e.g. in test or specific local development environments).
 */
export class OffEmailProvider implements EmailProvider {
  async send(_message: EmailMessage): Promise<EmailResult> {
    return { messageId: undefined };
  }
}
