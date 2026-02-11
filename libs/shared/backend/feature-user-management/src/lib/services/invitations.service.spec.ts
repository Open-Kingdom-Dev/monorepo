import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';

import { DB_TAG } from '@open-kingdom/shared-poly-util-constants';
import { UsersService } from '@open-kingdom/shared-backend-data-access-users';
import { InvitationsService } from './invitations.service';
import {
  USER_MANAGEMENT_OPTIONS,
  EMAIL_SENDER,
  INVITATION_STATUS,
} from '../types';
import type { EmailSender } from '../types';
import { invitations, Invitation } from '../schemas/invitations.schema';

interface MockQuery {
  invitations: {
    findFirst: jest.Mock<Promise<Partial<Invitation> | undefined>>;
  };
}

interface MockDb {
  query: MockQuery;
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
}

const createMockInvitation = (
  overrides: Partial<Invitation> = {}
): Invitation => ({
  id: 1,
  email: 'test@example.com',
  token: 'test-token',
  tokenExpiry: Date.now() + 86400000,
  invitedBy: 1,
  invitedAt: Date.now(),
  role: 'user',
  status: INVITATION_STATUS.PENDING,
  ...overrides,
});

describe('InvitationsService', () => {
  let service: InvitationsService;
  let mockUsersService: jest.Mocked<UsersService>;
  let mockDb: MockDb;
  let mockQuery: MockQuery;

  const mockOptions = {
    invitationTokenSecret: 'test-secret',
    invitationExpiryDays: 7,
    frontendBaseUrl: 'http://localhost:3000',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockQuery = {
      invitations: {
        findFirst: jest.fn(),
      },
    };

    mockDb = {
      query: mockQuery,
      insert: jest.fn().mockReturnValue({
        values: jest.fn().mockResolvedValue(undefined),
      }),
      update: jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
      }),
      delete: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      }),
    };

    mockUsersService = {
      findOne: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      ensureUser: jest.fn(),
      onModuleInit: jest.fn(),
    } as unknown as jest.Mocked<UsersService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvitationsService,
        { provide: DB_TAG, useValue: mockDb },
        { provide: USER_MANAGEMENT_OPTIONS, useValue: mockOptions },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    service = module.get<InvitationsService>(InvitationsService);
  });

  describe('inviting users', () => {
    it('creates an invitation and never returns the token', async () => {
      mockUsersService.findOne.mockResolvedValue(undefined);
      mockQuery.invitations.findFirst
        .mockResolvedValueOnce(undefined) // Check existing invitation
        .mockResolvedValueOnce({
          id: 1,
          email: 'new@example.com',
          token: 'generated-token',
          tokenExpiry: Date.now() + 86400000,
          invitedBy: 1,
          invitedAt: Date.now(),
          role: 'user',
          status: INVITATION_STATUS.PENDING,
        });

      const result = await service.invite('new@example.com', 'user', 1);

      expect(mockUsersService.findOne).toHaveBeenCalledWith('new@example.com');
      expect(mockDb.insert).toHaveBeenCalledWith(invitations);
      expect(result.email).toBe('new@example.com');
      expect(result.role).toBe('user');
      // Token should never be returned - only sent via email
      expect(result).not.toHaveProperty('token');
    });

    it('prevents inviting someone who already has an account', async () => {
      mockUsersService.findOne.mockResolvedValue({
        id: 1,
        email: 'existing@example.com',
        password: 'hash',
        firstName: 'Test',
        lastName: 'User',
      });

      await expect(
        service.invite('existing@example.com', 'user', 1)
      ).rejects.toThrow(BadRequestException);
    });

    it('prevents duplicate invitations to the same email', async () => {
      mockUsersService.findOne.mockResolvedValue(undefined);
      mockQuery.invitations.findFirst.mockResolvedValue(
        createMockInvitation({ email: 'pending@example.com' })
      );

      await expect(
        service.invite('pending@example.com', 'user', 1)
      ).rejects.toThrow(BadRequestException);
    });

    it('sends an email with the invitation link', async () => {
      const mockEmailSender: jest.Mocked<EmailSender> = {
        send: jest.fn().mockResolvedValue({ success: true }),
      };

      const moduleWithEmail: TestingModule = await Test.createTestingModule({
        providers: [
          InvitationsService,
          { provide: DB_TAG, useValue: mockDb },
          { provide: USER_MANAGEMENT_OPTIONS, useValue: mockOptions },
          { provide: UsersService, useValue: mockUsersService },
          { provide: EMAIL_SENDER, useValue: mockEmailSender },
        ],
      }).compile();

      const serviceWithEmail =
        moduleWithEmail.get<InvitationsService>(InvitationsService);

      mockUsersService.findOne.mockResolvedValue(undefined);
      mockQuery.invitations.findFirst
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({
          id: 1,
          email: 'new@example.com',
          token: 'generated-token',
          tokenExpiry: Date.now() + 86400000,
          invitedBy: 1,
          invitedAt: Date.now(),
          role: 'user',
          status: INVITATION_STATUS.PENDING,
        });

      await serviceWithEmail.invite('new@example.com', 'user', 1);

      expect(mockEmailSender.send).toHaveBeenCalledWith({
        to: 'new@example.com',
        subject: 'You have been invited',
        body: expect.stringContaining(
          'http://localhost:3000/accept-invitation?token='
        ),
      });
    });

    it('rolls back invitation when email sending fails', async () => {
      const mockEmailSender: jest.Mocked<EmailSender> = {
        send: jest
          .fn()
          .mockRejectedValue(new Error('Email service unavailable')),
      };

      const moduleWithEmail: TestingModule = await Test.createTestingModule({
        providers: [
          InvitationsService,
          { provide: DB_TAG, useValue: mockDb },
          { provide: USER_MANAGEMENT_OPTIONS, useValue: mockOptions },
          { provide: UsersService, useValue: mockUsersService },
          { provide: EMAIL_SENDER, useValue: mockEmailSender },
        ],
      }).compile();

      const serviceWithEmail =
        moduleWithEmail.get<InvitationsService>(InvitationsService);

      mockUsersService.findOne.mockResolvedValue(undefined);
      mockQuery.invitations.findFirst
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({
          id: 1,
          email: 'new@example.com',
          token: 'generated-token',
          tokenExpiry: Date.now() + 86400000,
          invitedBy: 1,
          invitedAt: Date.now(),
          role: 'user',
          status: INVITATION_STATUS.PENDING,
        });

      await expect(
        serviceWithEmail.invite('new@example.com', 'user', 1)
      ).rejects.toThrow(BadRequestException);

      expect(mockDb.delete).toHaveBeenCalledWith(invitations);
    });
  });

  describe('validating invitation tokens', () => {
    it('confirms a valid invitation token', async () => {
      mockQuery.invitations.findFirst.mockResolvedValue(
        createMockInvitation({
          email: 'valid@example.com',
          token: 'valid-token',
        })
      );

      const result = await service.validate('valid-token');

      expect(result.valid).toBe(true);
      expect(result.email).toBe('valid@example.com');
      expect(result.role).toBe('user');
    });

    it('rejects unknown tokens', async () => {
      mockQuery.invitations.findFirst.mockResolvedValue(undefined);

      const result = await service.validate('invalid-token');

      expect(result.valid).toBe(false);
    });

    it('rejects expired invitation tokens', async () => {
      mockQuery.invitations.findFirst.mockResolvedValue(
        createMockInvitation({
          email: 'expired@example.com',
          token: 'expired-token',
          tokenExpiry: Date.now() - 86400000,
        })
      );

      const result = await service.validate('expired-token');

      expect(result.valid).toBe(false);
      expect(mockDb.update).toHaveBeenCalledWith(invitations);
    });

    it('rejects already used invitation tokens', async () => {
      mockQuery.invitations.findFirst.mockResolvedValue(
        createMockInvitation({
          email: 'accepted@example.com',
          status: INVITATION_STATUS.ACCEPTED,
        })
      );

      const result = await service.validate('accepted-token');

      expect(result.valid).toBe(false);
    });
  });

  describe('accepting invitations', () => {
    it('creates the user account and completes the invitation', async () => {
      const mockUser = {
        id: 2,
        email: 'new@example.com',
        password: 'hash',
        firstName: 'New',
        lastName: 'User',
      };

      mockQuery.invitations.findFirst.mockResolvedValue(
        createMockInvitation({ email: 'new@example.com', token: 'valid-token' })
      );
      mockUsersService.create.mockResolvedValue(mockUser);

      const result = await service.accept(
        'valid-token',
        'password123',
        'New',
        'User'
      );

      expect(mockUsersService.create).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      });
      expect(mockDb.update).toHaveBeenCalledWith(invitations);
      expect(result).toEqual(mockUser);
    });

    it('rejects invalid invitation tokens', async () => {
      mockQuery.invitations.findFirst.mockResolvedValue(undefined);

      await expect(service.accept('invalid-token', 'password')).rejects.toThrow(
        BadRequestException
      );
    });
  });
});
