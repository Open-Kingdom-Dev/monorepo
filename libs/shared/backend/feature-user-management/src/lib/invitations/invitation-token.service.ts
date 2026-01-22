import { Injectable, Inject } from '@nestjs/common';
import * as crypto from 'crypto';

export const INVITATION_TOKEN_OPTIONS = 'INVITATION_TOKEN_OPTIONS';

export interface InvitationTokenOptions {
  secret: string;
  expiryDays: number;
}

export interface TokenPayload {
  email: string;
  expiresAt: number;
}

@Injectable()
export class InvitationTokenService {
  constructor(
    @Inject(INVITATION_TOKEN_OPTIONS)
    private readonly options: InvitationTokenOptions
  ) {}

  generate(email: string): { token: string; expiresAt: number } {
    const expiresAt =
      Date.now() + this.options.expiryDays * 24 * 60 * 60 * 1000;
    const payload: TokenPayload = { email, expiresAt };
    const data = JSON.stringify(payload);
    const signature = this.sign(data);
    const token = Buffer.from(`${data}.${signature}`).toString('base64url');

    return { token, expiresAt };
  }

  validate(token: string): TokenPayload | null {
    try {
      const decoded = Buffer.from(token, 'base64url').toString('utf-8');
      const [data, signature] = decoded.split(/\.(?=[^.]+$)/);

      if (!data || !signature) {
        return null;
      }

      const expectedSignature = this.sign(data);
      if (signature !== expectedSignature) {
        return null;
      }

      const payload: TokenPayload = JSON.parse(data);

      if (payload.expiresAt < Date.now()) {
        return null;
      }

      return payload;
    } catch {
      return null;
    }
  }

  private sign(data: string): string {
    return crypto
      .createHmac('sha256', this.options.secret)
      .update(data)
      .digest('base64url');
  }
}
