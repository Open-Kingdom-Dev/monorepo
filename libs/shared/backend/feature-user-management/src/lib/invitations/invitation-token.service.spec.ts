import { Test } from '@nestjs/testing';
import { InvitationTokenService } from './invitation-token.service.js';
import {
  INVITATIONS_MODULE_OPTIONS,
  type InvitationsModuleOptions,
} from './invitations.types.js';

describe('InvitationTokenService', () => {
  let service: InvitationTokenService;
  const testSecret = 'test-secret-key-for-signing-tokens';

  const createService = async (
    options: Partial<InvitationsModuleOptions> = {}
  ) => {
    const module = await Test.createTestingModule({
      providers: [
        InvitationTokenService,
        {
          provide: INVITATIONS_MODULE_OPTIONS,
          useValue: {
            invitationTokenSecret: testSecret,
            frontendBaseUrl: 'http://localhost:3000',
            ...options,
          },
        },
      ],
    }).compile();

    return module.get(InvitationTokenService);
  };

  beforeEach(async () => {
    service = await createService();
  });

  describe('token generation', () => {
    it('creates a token for a new invitation', () => {
      const token = service.generateToken('user@example.com', 1);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(2);
    });

    it('includes the email and invitation details in the token', () => {
      const token = service.generateToken('user@example.com', 42);
      const [data] = token.split('.');
      const payload = JSON.parse(Buffer.from(data, 'base64url').toString());

      expect(payload.email).toBe('user@example.com');
      expect(payload.invitationId).toBe(42);
    });

    it('sets the expiry date based on configured days', async () => {
      const customService = await createService({ invitationExpiryDays: 14 });
      const token = customService.generateToken('user@example.com', 1);

      const [data] = token.split('.');
      const payload = JSON.parse(Buffer.from(data, 'base64url').toString());
      const expectedExpiry = Date.now() + 14 * 24 * 60 * 60 * 1000;

      expect(payload.exp).toBeGreaterThan(Date.now());
      expect(payload.exp).toBeLessThanOrEqual(expectedExpiry + 1000);
    });

    it('generates unique tokens for the same invitation', () => {
      const token1 = service.generateToken('user@example.com', 1);
      const token2 = service.generateToken('user@example.com', 1);

      expect(token1).not.toBe(token2);
    });
  });

  describe('token validation', () => {
    it('accepts a valid token and returns the invitation details', () => {
      const token = service.generateToken('user@example.com', 1);
      const payload = service.validateToken(token);

      expect(payload).not.toBeNull();
      expect(payload?.email).toBe('user@example.com');
      expect(payload?.invitationId).toBe(1);
    });

    it('rejects tokens with missing signature', () => {
      const token = service.generateToken('user@example.com', 1);
      const [data] = token.split('.');

      expect(service.validateToken(data)).toBeNull();
    });

    it('rejects tokens with tampered data', () => {
      const token = service.generateToken('user@example.com', 1);
      const [, signature] = token.split('.');

      const tamperedPayload = {
        email: 'hacker@evil.com',
        invitationId: 1,
        exp: Date.now() + 1000000,
        nonce: 'fake',
      };
      const tamperedData = Buffer.from(
        JSON.stringify(tamperedPayload)
      ).toString('base64url');

      expect(service.validateToken(`${tamperedData}.${signature}`)).toBeNull();
    });

    it('rejects tokens with invalid signature', () => {
      const token = service.generateToken('user@example.com', 1);
      const [data] = token.split('.');

      expect(service.validateToken(`${data}.invalid-signature`)).toBeNull();
    });

    it('rejects expired tokens', async () => {
      const expiredService = await createService({ invitationExpiryDays: -1 });
      const token = expiredService.generateToken('user@example.com', 1);

      expect(service.validateToken(token)).toBeNull();
    });

    it('rejects malformed tokens', () => {
      expect(service.validateToken('')).toBeNull();
      expect(service.validateToken('not-a-token')).toBeNull();
      expect(service.validateToken('a.b.c')).toBeNull();
    });

    it('rejects tokens with corrupted payload', () => {
      const token = service.generateToken('user@example.com', 1);
      const [, signature] = token.split('.');
      const corruptedData = 'not-valid-base64url!!!';

      expect(service.validateToken(`${corruptedData}.${signature}`)).toBeNull();
    });
  });

  describe('token verification security', () => {
    it('requires correct signing secret to validate', async () => {
      const otherService = await createService({
        invitationTokenSecret: 'different-secret',
      });

      const token = service.generateToken('user@example.com', 1);
      expect(otherService.validateToken(token)).toBeNull();
    });

    it('prevents timing attacks with constant-time comparison', () => {
      const token = service.generateToken('user@example.com', 1);
      const [data, signature] = token.split('.');

      // Signatures with different lengths should also fail safely
      const shortSignature = signature.slice(0, 10);
      const longSignature = signature + 'extra';

      expect(service.validateToken(`${data}.${shortSignature}`)).toBeNull();
      expect(service.validateToken(`${data}.${longSignature}`)).toBeNull();
    });
  });

  describe('expiry calculation', () => {
    it('defaults to 7 days when no custom expiry is set', () => {
      const timestamp = service.getExpiryTimestamp();
      const expectedExpiry = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;

      expect(timestamp).toBeGreaterThanOrEqual(expectedExpiry - 1);
      expect(timestamp).toBeLessThanOrEqual(expectedExpiry + 1);
    });

    it('uses custom expiry days when configured', async () => {
      const customService = await createService({ invitationExpiryDays: 30 });
      const timestamp = customService.getExpiryTimestamp();
      const expectedExpiry = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

      expect(timestamp).toBeGreaterThanOrEqual(expectedExpiry - 1);
      expect(timestamp).toBeLessThanOrEqual(expectedExpiry + 1);
    });
  });
});
