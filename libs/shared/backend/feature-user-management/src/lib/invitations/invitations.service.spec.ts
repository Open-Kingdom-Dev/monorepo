import { Test } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { DB_TAG } from '@open-kingdom/shared-poly-util-constants';
import { UsersService } from '@open-kingdom/shared-backend-data-access-users';
import { EmailService } from '@open-kingdom/shared-backend-feature-email';
import { InvitationsService } from './invitations.service.js';
import { InvitationTokenService } from './invitation-token.service.js';
import { INVITATIONS_MODULE_OPTIONS } from './invitations.types.js';

// Mock external dependencies
const mockUsersService = {
  findOne: jest.fn(),
  ensureUser: jest.fn(),
};

const mockEmailService = {
  send: jest.fn(),
};

const mockDb = {
  select: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockTokenService = {
  generateToken: jest.fn(),
  validateToken: jest.fn(),
  getExpiryTimestamp: jest.fn(),
};

describe('InvitationsService', () => {
  let service: InvitationsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        InvitationsService,
        { provide: DB_TAG, useValue: mockDb },
        {
          provide: INVITATIONS_MODULE_OPTIONS,
          useValue: {
            invitationTokenSecret: 'test-secret',
            frontendBaseUrl: 'http://localhost:3000',
            invitationExpiryDays: 7,
          },
        },
        { provide: InvitationTokenService, useValue: mockTokenService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get(InvitationsService);
  });

  describe('sending invitations', () => {
    const validDto = {
      email: 'newuser@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'user' as const,
    };

    beforeEach(() => {
      mockUsersService.findOne.mockResolvedValue(null);
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest
            .fn()
            .mockResolvedValue([{ id: 1, email: validDto.email }]),
        }),
      });
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
      });
      mockTokenService.generateToken.mockReturnValue('generated-token');
      mockTokenService.getExpiryTimestamp.mockReturnValue(
        Math.floor(Date.now() / 1000) + 604800
      );
      mockEmailService.send.mockResolvedValue({ success: true });
    });

    it('sends an invitation to a new user', async () => {
      const result = await service.invite(validDto, 1);

      expect(result.success).toBe(true);
      expect(result.invitationId).toBe(1);
      expect(mockEmailService.send).toHaveBeenCalled();
    });

    it('prevents inviting someone who already has an account', async () => {
      mockUsersService.findOne.mockResolvedValue({
        id: 1,
        email: validDto.email,
      });

      await expect(service.invite(validDto, 1)).rejects.toThrow(
        ConflictException
      );
      await expect(service.invite(validDto, 1)).rejects.toThrow(
        'User with this email already exists'
      );
    });

    it('prevents sending duplicate invitations to the same email', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ id: 1, status: 'pending' }]),
        }),
      });

      await expect(service.invite(validDto, 1)).rejects.toThrow(
        ConflictException
      );
      await expect(service.invite(validDto, 1)).rejects.toThrow(
        'An invitation is already pending for this email'
      );
    });

    it('stores the invitation with correct details', async () => {
      await service.invite(validDto, 1);

      expect(mockDb.insert).toHaveBeenCalled();
      const insertCall = mockDb.insert.mock.calls[0];
      expect(insertCall).toBeDefined();
    });

    it('sends the invitation email with a link to accept', async () => {
      await service.invite(validDto, 1);

      expect(mockEmailService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: validDto.email,
          subject: expect.any(String),
          body: expect.stringContaining('http://localhost:3000'),
        })
      );
    });
  });

  describe('validating invitation tokens', () => {
    const validInvitation = {
      id: 1,
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'user',
      status: 'pending',
      token: 'valid-token',
    };

    it('confirms a valid token and returns invitation details', async () => {
      mockTokenService.validateToken.mockReturnValue({
        email: validInvitation.email,
        invitationId: 1,
      });
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([validInvitation]),
        }),
      });

      const result = await service.validateToken('valid-token');

      expect(result.valid).toBe(true);
      expect(result.email).toBe(validInvitation.email);
      expect(result.firstName).toBe(validInvitation.firstName);
    });

    it('rejects an expired or invalid token', async () => {
      mockTokenService.validateToken.mockReturnValue(null);

      const result = await service.validateToken('invalid-token');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid or expired token');
    });

    it('rejects a token for a non-existent invitation', async () => {
      mockTokenService.validateToken.mockReturnValue({
        email: 'user@example.com',
        invitationId: 999,
      });
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      const result = await service.validateToken('orphan-token');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invitation not found');
    });

    it('rejects a token for an already-used invitation', async () => {
      mockTokenService.validateToken.mockReturnValue({
        email: 'user@example.com',
        invitationId: 1,
      });
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest
            .fn()
            .mockResolvedValue([{ ...validInvitation, status: 'accepted' }]),
        }),
      });

      const result = await service.validateToken('used-token');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invitation has already been used or expired');
    });

    it('rejects when the token does not match the stored token', async () => {
      mockTokenService.validateToken.mockReturnValue({
        email: 'user@example.com',
        invitationId: 1,
      });
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest
            .fn()
            .mockResolvedValue([
              { ...validInvitation, token: 'different-token' },
            ]),
        }),
      });

      const result = await service.validateToken('mismatched-token');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Token mismatch');
    });
  });

  describe('accepting invitations', () => {
    const validInvitation = {
      id: 1,
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'user',
      status: 'pending',
      token: 'valid-token',
      invitedBy: 1,
    };

    beforeEach(() => {
      mockTokenService.validateToken.mockReturnValue({
        email: validInvitation.email,
        invitationId: 1,
      });
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([validInvitation]),
        }),
      });
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
      });
      mockUsersService.ensureUser.mockResolvedValue({ id: 1 });
    });

    it('creates an account when accepting a valid invitation', async () => {
      const result = await service.accept('valid-token', 'SecurePass123');

      expect(result.success).toBe(true);
      expect(result.email).toBe(validInvitation.email);
      expect(mockUsersService.ensureUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: validInvitation.email,
          password: 'SecurePass123',
        })
      );
    });

    it('allows overriding name from the invitation', async () => {
      await service.accept('valid-token', 'SecurePass123', 'Jane', 'Smith');

      expect(mockUsersService.ensureUser).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'Jane',
          lastName: 'Smith',
        })
      );
    });

    it('uses invitation name when no override is provided', async () => {
      await service.accept('valid-token', 'SecurePass123');

      expect(mockUsersService.ensureUser).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: validInvitation.firstName,
          lastName: validInvitation.lastName,
        })
      );
    });

    it('marks the invitation as accepted after account creation', async () => {
      await service.accept('valid-token', 'SecurePass123');

      expect(mockDb.update).toHaveBeenCalled();
    });

    it('rejects passwords shorter than 8 characters', async () => {
      await expect(service.accept('valid-token', 'short')).rejects.toThrow(
        BadRequestException
      );
      await expect(service.accept('valid-token', 'short')).rejects.toThrow(
        'Password must be at least 8 characters'
      );
    });

    it('rejects empty passwords', async () => {
      await expect(service.accept('valid-token', '')).rejects.toThrow(
        BadRequestException
      );
    });

    it('rejects invalid tokens during acceptance', async () => {
      mockTokenService.validateToken.mockReturnValue(null);

      await expect(
        service.accept('invalid-token', 'SecurePass123')
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.accept('invalid-token', 'SecurePass123')
      ).rejects.toThrow('Invalid or expired invitation token');
    });

    it('rejects already-used invitations', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest
            .fn()
            .mockResolvedValue([{ ...validInvitation, status: 'accepted' }]),
        }),
      });

      await expect(
        service.accept('used-token', 'SecurePass123')
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.accept('used-token', 'SecurePass123')
      ).rejects.toThrow('Invalid invitation');
    });
  });

  describe('listing pending invitations', () => {
    it('returns all invitations waiting to be accepted', async () => {
      const pendingInvitations = [
        { id: 1, email: 'user1@example.com', status: 'pending' },
        { id: 2, email: 'user2@example.com', status: 'pending' },
      ];

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(pendingInvitations),
        }),
      });

      const result = await service.listPending();

      expect(result).toHaveLength(2);
      expect(result[0].email).toBe('user1@example.com');
    });
  });

  describe('deleting invitations', () => {
    it('removes an invitation from the system', async () => {
      mockDb.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      });

      await expect(service.delete(1)).resolves.not.toThrow();
      expect(mockDb.delete).toHaveBeenCalled();
    });
  });
});
