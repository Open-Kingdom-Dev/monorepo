import crypto from 'crypto';
import {
  EmailMessage,
  EmailResult,
  EmailProvider,
  CapturedEmail,
  GmailTwinErrorMode,
} from '../email.types.js';

export interface GmailTwinProviderConfig {
  defaultFrom?: string;
}

export interface SimulatedGmailError extends Error {
  code?: number;
  status?: number;
  response?: {
    status: number;
    data: {
      error: {
        code: number;
        errors: Array<{
          message: string;
          domain: string;
          reason: string;
        }>;
      };
    };
    headers: Record<string, string>;
  };
}

export class GmailTwinProvider implements EmailProvider {
  private emails: CapturedEmail[] = [];
  private activeErrorMode: GmailTwinErrorMode | null = null;
  private readonly defaultFrom: string;

  constructor(config?: GmailTwinProviderConfig) {
    this.defaultFrom = config?.defaultFrom || 'sender@example.com';
  }

  async send(message: EmailMessage): Promise<EmailResult> {
    if (this.activeErrorMode) {
      this.throwSimulatedError(this.activeErrorMode);
    }

    const id = `msg-${crypto.randomUUID()}`;
    const threadId = `thread-${crypto.randomUUID()}`;
    const emailEntry: CapturedEmail = {
      id,
      threadId,
      to: message.to,
      from: message.from || this.defaultFrom,
      subject: message.subject,
      text: message.text,
      html: message.html,
      timestamp: new Date().toISOString(),
    };

    this.emails.unshift(emailEntry); // LIFO: prepend to list
    return { messageId: id };
  }

  setErrorMode(mode: GmailTwinErrorMode | null): void {
    this.activeErrorMode = mode;
  }

  getErrorMode(): GmailTwinErrorMode | null {
    return this.activeErrorMode;
  }

  getEmails(to?: string): CapturedEmail[] {
    if (!to) {
      return [...this.emails];
    }
    const filterAddr = to.toLowerCase();
    return this.emails.filter((email) =>
      email.to.some((addr) => addr.toLowerCase() === filterAddr)
    );
  }

  clear(): void {
    this.emails = [];
  }

  reset(): void {
    this.clear();
    this.activeErrorMode = null;
  }

  private throwSimulatedError(mode: GmailTwinErrorMode): never {
    const errorPayloads = {
      'insufficient-permissions': {
        status: 403,
        message: 'Insufficient Permission',
        data: {
          error: {
            code: 403,
            message: 'Insufficient Permission',
            errors: [
              {
                message: 'Insufficient Permission',
                domain: 'global',
                reason: 'insufficientPermissions',
              },
            ],
          },
        },
      },
      'rate-limit': {
        status: 429,
        message: 'User Rate Limit Exceeded',
        data: {
          error: {
            code: 429,
            message: 'User Rate Limit Exceeded',
            errors: [
              {
                message: 'User Rate Limit Exceeded',
                domain: 'usageLimits',
                reason: 'userRateLimitExceeded',
              },
            ],
          },
        },
      },
      'invalid-recipient': {
        status: 400,
        message: 'Invalid recipient address format',
        data: {
          error: {
            code: 400,
            message: 'Invalid recipient address format',
            errors: [
              {
                message: 'Invalid recipient address format',
                domain: 'global',
                reason: 'invalidArgument',
              },
            ],
          },
        },
      },
    };

    const payload = errorPayloads[mode];
    if (!payload) {
      throw new Error(`Unknown simulated error mode: ${mode}`);
    }

    const err = new Error(payload.message) as SimulatedGmailError;
    err.code = payload.status;
    err.status = payload.status;
    err.response = {
      status: payload.status,
      data: payload.data,
      headers: mode === 'rate-limit' ? { 'retry-after': '60' } : {},
    };
    throw err;
  }
}
