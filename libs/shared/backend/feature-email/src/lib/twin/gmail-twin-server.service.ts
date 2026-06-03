import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { EmailStore, CapturedEmail } from './email-store.js';
import { GmailTwinErrorMode } from '../email.types.js';

@Injectable()
export class GmailTwinServerService {
  private readonly emailStore = new EmailStore();
  private activeErrorMode: GmailTwinErrorMode | null = null;

  getEmailStore(): EmailStore {
    return this.emailStore;
  }

  setErrorMode(mode: GmailTwinErrorMode | null): void {
    this.activeErrorMode = mode;
  }

  getErrorMode(): GmailTwinErrorMode | null {
    return this.activeErrorMode;
  }

  triggerSimulatedError(mode: GmailTwinErrorMode, res: Response): never {
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
