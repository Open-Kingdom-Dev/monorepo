import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { EmailStore, CapturedEmail } from './email-store.js';

export type GmailErrorMode = 'insufficient-permissions' | 'rate-limit' | 'invalid-recipient';

@Injectable()
export class GmailTwinService {
  private readonly emailStore = new EmailStore();
  private activeErrorMode: GmailErrorMode | null = null;

  getEmailStore(): EmailStore {
    return this.emailStore;
  }

  setErrorMode(mode: GmailErrorMode | null): void {
    this.activeErrorMode = mode;
  }

  getErrorMode(): GmailErrorMode | null {
    return this.activeErrorMode;
  }

  triggerSimulatedError(mode: GmailErrorMode, res: Response): never {
    if (mode === 'insufficient-permissions') {
      throw new HttpException(
        {
          error: {
            code: HttpStatus.FORBIDDEN,
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
        HttpStatus.FORBIDDEN
      );
    }

    if (mode === 'rate-limit') {
      res.setHeader('Retry-After', '60');
      throw new HttpException(
        {
          error: {
            code: HttpStatus.TOO_MANY_REQUESTS,
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
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    if (mode === 'invalid-recipient') {
      throw new HttpException(
        {
          error: {
            code: HttpStatus.BAD_REQUEST,
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
        HttpStatus.BAD_REQUEST
      );
    }

    throw new HttpException(
      {
        error: {
          code: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Unknown simulated error mode',
        },
      },
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }

  async sendEmail(raw: string, res: Response): Promise<CapturedEmail> {
    if (this.activeErrorMode) {
      this.triggerSimulatedError(this.activeErrorMode, res);
    }
    return this.emailStore.capture(raw);
  }

  getEmails(to?: string): CapturedEmail[] {
    return this.emailStore.query(to);
  }

  reset(): void {
    this.emailStore.clear();
    this.activeErrorMode = null;
  }
}

