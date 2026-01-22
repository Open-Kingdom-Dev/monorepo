import { Test } from '@nestjs/testing';
import {
  InvitationTokenService,
  INVITATION_TOKEN_OPTIONS,
  InvitationTokenOptions,
} from './invitation-token.service';

describe('InvitationTokenService', () => {
  let service: InvitationTokenService;
  const testSecret = 'test-secret-for-invitation-tokens';

  const createService = async (
    options: Partial<InvitationTokenOptions> = {}
  ) => {
    const module = await Test.createTestingModule({
      providers: [
        InvitationTokenService,
        {
          provide: INVITATION_TOKEN_OPTIONS,
          useValue: {
            secret: testSecret,
            expiryDays: 7,
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

  describe('generating invitation tokens', () => {
    it('creates a token for a given email', () => {
      const { token } = service.generate('user@example.com');

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('includes an expiry date when generating a token', () => {
      const { expiresAt } = service.generate('user@example.com');

      expect(expiresAt).toBeGreaterThan(Date.now());
    });

    it('sets expiry based on configured days', async () => {
      const customService = await createService({ expiryDays: 14 });
      const { expiresAt } = customService.generate('user@example.com');

      const fourteenDaysFromNow = Date.now() + 14 * 24 * 60 * 60 * 1000;
      expect(expiresAt).toBeLessThanOrEqual(fourteenDaysFromNow + 1000);
      expect(expiresAt).toBeGreaterThan(Date.now());
    });
  });

  describe('validating invitation tokens', () => {
    it('accepts a valid token and returns the email', () => {
      const { token } = service.generate('user@example.com');
      const payload = service.validate(token);

      expect(payload).not.toBeNull();
      expect(payload?.email).toBe('user@example.com');
    });

    it('rejects tokens that have been tampered with', () => {
      const { token } = service.generate('user@example.com');

      // Decode, tamper with the signature, and re-encode
      const decoded = Buffer.from(token, 'base64url').toString('utf-8');
      const [data] = decoded.split(/\.(?=[^.]+$)/);
      const tamperedDecoded = `${data}.tampered-signature`;
      const tamperedToken = Buffer.from(tamperedDecoded).toString('base64url');

      expect(service.validate(tamperedToken)).toBeNull();
    });

    it('rejects expired tokens', async () => {
      const expiredService = await createService({ expiryDays: -1 });
      const { token } = expiredService.generate('user@example.com');

      expect(service.validate(token)).toBeNull();
    });

    it('rejects empty or malformed tokens', () => {
      expect(service.validate('')).toBeNull();
      expect(service.validate('not-a-valid-token')).toBeNull();
      expect(service.validate('random.garbage.data')).toBeNull();
    });
  });

  describe('token security', () => {
    it('requires the correct secret to validate tokens', async () => {
      const otherService = await createService({ secret: 'different-secret' });
      const { token } = service.generate('user@example.com');

      expect(otherService.validate(token)).toBeNull();
    });

    it('generates different tokens for different emails', () => {
      const { token: token1 } = service.generate('user1@example.com');
      const { token: token2 } = service.generate('user2@example.com');

      expect(token1).not.toBe(token2);
    });
  });
});
