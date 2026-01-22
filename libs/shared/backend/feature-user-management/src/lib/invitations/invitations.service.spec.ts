import { Test } from '@nestjs/testing';
import { DB_TAG } from '@open-kingdom/shared-poly-util-constants';
import { EmailService } from '@open-kingdom/shared-backend-feature-email';

import {
  InvitationsService,
  USER_MANAGEMENT_OPTIONS,
} from './invitations.service';
import { InvitationTokenService } from './invitation-token.service';

describe('InvitationsService', () => {
  let service: InvitationsService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockDb: any;
  let mockTokenService: jest.Mocked<InvitationTokenService>;
  let mockEmailService: jest.Mocked<EmailService>;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockDb = {
      query: {
        users: { findFirst: jest.fn() },
        invitations: { findFirst: jest.fn() },
      },
      insert: jest.fn().mockReturnValue({
        values: jest.fn().mockResolvedValue(undefined),
      }),
      update: jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
      }),
    };

    mockTokenService = {
      generate: jest.fn().mockReturnValue({
        token: 'generated-token',
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      }),
      validate: jest.fn(),
    } as unknown as jest.Mocked<InvitationTokenService>;

    mockEmailService = {
      send: jest.fn().mockResolvedValue({ success: true }),
    } as unknown as jest.Mocked<EmailService>;

    const module = await Test.createTestingModule({
      providers: [
        InvitationsService,
        { provide: DB_TAG, useValue: mockDb },
        {
          provide: USER_MANAGEMENT_OPTIONS,
          useValue: {
            invitationTokenSecret: 'test-secret',
            frontendBaseUrl: 'http://localhost:4200',
            invitationExpiryDays: 7,
          },
        },
        { provide: InvitationTokenService, useValue: mockTokenService },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get(InvitationsService);
  });

  describe('sending invitations', () => {
    beforeEach(() => {
      mockDb.query.users.findFirst.mockResolvedValue(null);
      mockDb.query.invitations.findFirst.mockResolvedValue(null);
    });

    it('sends an invitation to a new user', async () => {
      const result = await service.invite({ email: 'newuser@example.com' }, 1);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Invitation sent successfully');
      expect(mockEmailService.send).toHaveBeenCalled();
    });

    it('includes the invitation token for verification', async () => {
      const result = await service.invite({ email: 'newuser@example.com' }, 1);

      expect(result.token).toBe('generated-token');
    });

    it('prevents inviting someone who already has an account', async () => {
      mockDb.query.users.findFirst.mockResolvedValue({
        id: 1,
        email: 'existing@example.com',
      });

      const result = await service.invite({ email: 'existing@example.com' }, 1);

      expect(result.success).toBe(false);
      expect(result.message).toBe('A user with this email already exists');
    });

    it('prevents sending duplicate invitations', async () => {
      mockDb.query.invitations.findFirst.mockResolvedValue({
        id: 1,
        email: 'pending@example.com',
        status: 'pending',
      });

      const result = await service.invite({ email: 'pending@example.com' }, 1);

      expect(result.success).toBe(false);
      expect(result.message).toBe(
        'An invitation has already been sent to this email'
      );
    });

    it('assigns the specified role to the invitation', async () => {
      await service.invite({ email: 'admin@example.com', role: 'admin' }, 1);

      const insertCall = mockDb.insert().values;
      expect(insertCall).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'admin' })
      );
    });

    it('defaults to user role when not specified', async () => {
      await service.invite({ email: 'user@example.com' }, 1);

      const insertCall = mockDb.insert().values;
      expect(insertCall).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'user' })
      );
    });
  });

  describe('validating invitation tokens', () => {
    it('confirms a valid token and returns invitation details', async () => {
      mockTokenService.validate.mockReturnValue({
        email: 'user@example.com',
        expiresAt: Date.now() + 86400000,
      });
      mockDb.query.invitations.findFirst.mockResolvedValue({
        id: 1,
        email: 'user@example.com',
        role: 'user',
        status: 'pending',
      });

      const result = await service.validate('valid-token');

      expect(result.valid).toBe(true);
      expect(result.email).toBe('user@example.com');
      expect(result.role).toBe('user');
    });

    it('rejects an invalid or expired token', async () => {
      mockTokenService.validate.mockReturnValue(null);

      const result = await service.validate('invalid-token');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid or expired invitation token');
    });

    it('rejects a token for an already-used invitation', async () => {
      mockTokenService.validate.mockReturnValue({
        email: 'user@example.com',
        expiresAt: Date.now() + 86400000,
      });
      mockDb.query.invitations.findFirst.mockResolvedValue(null);

      const result = await service.validate('used-token');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invitation not found or already used');
    });
  });

  describe('accepting invitations', () => {
    const validInvitation = {
      id: 1,
      email: 'user@example.com',
      role: 'user',
      status: 'pending',
      token: 'valid-token',
      invitedBy: 1,
    };

    beforeEach(() => {
      mockTokenService.validate.mockReturnValue({
        email: 'user@example.com',
        expiresAt: Date.now() + 86400000,
      });
      mockDb.query.invitations.findFirst.mockResolvedValue(validInvitation);
    });

    it('creates an account when accepting a valid invitation', async () => {
      const result = await service.accept({
        token: 'valid-token',
        password: 'SecurePass123!',
      });

      expect(result.success).toBe(true);
      expect(result.email).toBe('user@example.com');
    });

    it('stores the user with the invited role', async () => {
      await service.accept({
        token: 'valid-token',
        password: 'SecurePass123!',
      });

      const insertCall = mockDb.insert().values;
      expect(insertCall).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'user' })
      );
    });

    it('allows setting name during acceptance', async () => {
      await service.accept({
        token: 'valid-token',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
      });

      const insertCall = mockDb.insert().values;
      expect(insertCall).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'John',
          lastName: 'Doe',
        })
      );
    });

    it('marks the invitation as accepted after account creation', async () => {
      await service.accept({
        token: 'valid-token',
        password: 'SecurePass123!',
      });

      expect(mockDb.update).toHaveBeenCalled();
      const setCall = mockDb.update().set;
      expect(setCall).toHaveBeenCalledWith({ status: 'accepted' });
    });

    it('rejects invalid tokens during acceptance', async () => {
      mockTokenService.validate.mockReturnValue(null);
      mockDb.query.invitations.findFirst.mockResolvedValue(null);

      const result = await service.accept({
        token: 'invalid-token',
        password: 'SecurePass123!',
      });

      expect(result.success).toBe(false);
    });

    it('handles case when invitation record is not found after token validation', async () => {
      // Token validates successfully but invitation is not found in DB
      mockDb.query.invitations.findFirst
        .mockResolvedValueOnce({
          id: 1,
          status: 'pending',
          email: 'user@example.com',
        })
        .mockResolvedValueOnce(null);

      const result = await service.accept({
        token: 'valid-token',
        password: 'SecurePass123!',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invitation not found');
    });
  });

  describe('email notifications', () => {
    beforeEach(() => {
      mockDb.query.users.findFirst.mockResolvedValue(null);
      mockDb.query.invitations.findFirst.mockResolvedValue(null);
    });

    it('sends invitation email with acceptance link', async () => {
      await service.invite({ email: 'newuser@example.com' }, 1);

      expect(mockEmailService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'newuser@example.com',
          subject: 'You have been invited',
        })
      );
    });

    it('includes the frontend URL in the invitation email', async () => {
      await service.invite({ email: 'newuser@example.com' }, 1);

      const emailCall = mockEmailService.send.mock.calls[0][0];
      expect(emailCall.body).toContain('http://localhost:4200');
    });

    it('continues without error when email fails to send', async () => {
      mockEmailService.send.mockRejectedValue(new Error('SMTP error'));

      const result = await service.invite({ email: 'newuser@example.com' }, 1);

      // Should still succeed even if email fails
      expect(result.success).toBe(true);
    });
  });

  describe('without email service', () => {
    let serviceWithoutEmail: InvitationsService;

    beforeEach(async () => {
      const module = await Test.createTestingModule({
        providers: [
          InvitationsService,
          { provide: DB_TAG, useValue: mockDb },
          {
            provide: USER_MANAGEMENT_OPTIONS,
            useValue: {
              invitationTokenSecret: 'test-secret',
              frontendBaseUrl: 'http://localhost:4200',
              invitationExpiryDays: 7,
            },
          },
          { provide: InvitationTokenService, useValue: mockTokenService },
          // EmailService not provided
        ],
      }).compile();

      serviceWithoutEmail = module.get(InvitationsService);
      mockDb.query.users.findFirst.mockResolvedValue(null);
      mockDb.query.invitations.findFirst.mockResolvedValue(null);
    });

    it('works without email service configured', async () => {
      const result = await serviceWithoutEmail.invite(
        { email: 'newuser@example.com' },
        1
      );

      expect(result.success).toBe(true);
    });
  });
});
