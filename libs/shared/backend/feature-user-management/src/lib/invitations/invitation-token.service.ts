import { Injectable, Inject } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  INVITATIONS_MODULE_OPTIONS,
  type InvitationsModuleOptions,
  type TokenPayload,
} from './invitations.types.js';

@Injectable()
export class InvitationTokenService {
  private readonly expiryDays: number;

  constructor(
    @Inject(INVITATIONS_MODULE_OPTIONS)
    private readonly options: InvitationsModuleOptions
  ) {
    this.expiryDays = options.invitationExpiryDays ?? 7;
  }

  // Generate HMAC-SHA256 signed token
  generateToken(email: string, invitationId: number): string {
    const payload: TokenPayload = {
      email,
      invitationId,
      exp: Date.now() + this.expiryDays * 24 * 60 * 60 * 1000,
      nonce: crypto.randomBytes(16).toString('hex'),
    };

    const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = this.sign(data);
    return `${data}.${signature}`;
  }

  // Validate token and return payload, or null if invalid/expired
  validateToken(token: string): TokenPayload | null {
    const [data, signature] = token.split('.');
    if (!data || !signature) return null;

    if (!this.verifySignature(data, signature)) return null;

    const payload = this.parsePayload(data);
    if (!payload) return null;

    return payload.exp < Date.now() ? null : payload;
  }

  getExpiryTimestamp(): number {
    return Math.floor(Date.now() / 1000) + this.expiryDays * 24 * 60 * 60;
  }

  private parsePayload(data: string): TokenPayload | null {
    try {
      return JSON.parse(Buffer.from(data, 'base64url').toString());
    } catch {
      return null;
    }
  }

  private sign(data: string): string {
    return crypto
      .createHmac('sha256', this.options.invitationTokenSecret)
      .update(data)
      .digest('base64url');
  }

  private verifySignature(data: string, signature: string): boolean {
    const expected = Buffer.from(this.sign(data), 'base64url');
    const actual = Buffer.from(signature, 'base64url');

    return (
      expected.length === actual.length &&
      crypto.timingSafeEqual(expected, actual)
    );
  }
}
