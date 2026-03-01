import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  BadGatewayException,
  NotFoundException,
} from '@nestjs/common';

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
    findMany: jest.Mock<Promise<Partial<Invitation>[]>>;
  };
  roles: {
    findFirst: jest.Mock;
  };
}

interface MockDb {
  query: MockQuery;
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
}

const MOCK_ROLE_ID = 2;

const createMockInvitation = (
  overrides: Partial<Invitation> = {}
): Invitation => ({
  id: 1,
  email: 'test@example.com',
  token: 'test-token',
  tokenExpiry: Date.now() + 86400000,
  invitedBy: 1,
  invitedAt: Date.now(),
  roleId: MOCK_ROLE_ID,
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
        findMany: jest.fn().mockResolvedValue([]),
      },
      roles: {
        findFirst: jest
          .fn()
          .mockResolvedValue({ id: MOCK_ROLE_ID, name: 'user', priority: 10 }),
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
    it('keeps the invitation link private when creating a new invite', async () => {
      mockUsersService.findOne.mockResolvedValue(undefined);
      mockQuery.invitations.findFirst
        .mockResolvedValueOnce(undefined) // Check existing invitation
        .mockResolvedValueOnce(
          createMockInvitation({
            email: 'new@example.com',
            token: 'generated-token',
          })
        );

      const result = await service.invite('new@example.com', 'user', 1);

      expect(mockUsersService.findOne).toHaveBeenCalledWith('new@example.com');
      expect(mockDb.insert).toHaveBeenCalledWith(invitations);
      expect(result.email).toBe('new@example.com');
      expect(result.roleId).toBe(MOCK_ROLE_ID);
      // Token should never be returned - only sent via email
      expect(result).not.toHaveProperty('token');
    });

    it('rejects inviting with a non-existent role', async () => {
      mockUsersService.findOne.mockResolvedValue(undefined);
      mockQuery.invitations.findFirst.mockResolvedValueOnce(undefined);
      mockQuery.roles.findFirst.mockResolvedValueOnce(undefined);

      await expect(
        service.invite('new@example.com', 'nonexistent', 1)
      ).rejects.toThrow(BadRequestException);
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

    it('sends the invited user an email with a link to join', async () => {
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
        .mockResolvedValueOnce(
          createMockInvitation({
            email: 'new@example.com',
            token: 'generated-token',
          })
        );

      await serviceWithEmail.invite('new@example.com', 'user', 1);

      expect(mockEmailSender.send).toHaveBeenCalledWith({
        to: 'new@example.com',
        subject: 'You have been invited',
        body: expect.stringContaining(
          'http://localhost:3000/accept-invitation?token='
        ),
      });
    });

    it('removes the invitation and tells the admin when the email service is unavailable', async () => {
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
        .mockResolvedValueOnce(
          createMockInvitation({
            email: 'new@example.com',
            token: 'generated-token',
          })
        );

      await expect(
        serviceWithEmail.invite('new@example.com', 'user', 1)
      ).rejects.toThrow(BadGatewayException);

      expect(mockDb.delete).toHaveBeenCalledWith(invitations);
    });

    it('removes the invitation and tells the admin when the email cannot be delivered', async () => {
      const mockEmailSender: jest.Mocked<EmailSender> = {
        send: jest
          .fn()
          .mockResolvedValue({ success: false, error: 'Invalid recipient' }),
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
        .mockResolvedValueOnce(
          createMockInvitation({
            email: 'new@example.com',
            token: 'generated-token',
          })
        );

      await expect(
        serviceWithEmail.invite('new@example.com', 'user', 1)
      ).rejects.toThrow(BadGatewayException);

      expect(mockDb.delete).toHaveBeenCalledWith(invitations);
    });

    it('removes the invitation and tells the admin even when no failure reason is available', async () => {
      const mockEmailSender: jest.Mocked<EmailSender> = {
        send: jest.fn().mockResolvedValue({ success: false }),
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
        .mockResolvedValueOnce(
          createMockInvitation({
            email: 'new@example.com',
            token: 'generated-token',
          })
        );

      await expect(
        serviceWithEmail.invite('new@example.com', 'user', 1)
      ).rejects.toThrow(BadGatewayException);

      expect(mockDb.delete).toHaveBeenCalledWith(invitations);
    });

    it('always cleans up and informs the admin regardless of how the email service fails', async () => {
      const mockEmailSender: jest.Mocked<EmailSender> = {
        send: jest.fn().mockRejectedValue('string error'),
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
        .mockResolvedValueOnce(
          createMockInvitation({
            email: 'new@example.com',
            token: 'generated-token',
          })
        );

      await expect(
        serviceWithEmail.invite('new@example.com', 'user', 1)
      ).rejects.toThrow(BadGatewayException);

      expect(mockDb.delete).toHaveBeenCalledWith(invitations);
    });

    it('tells the invited user the link expires in 7 days when no custom expiry is set', async () => {
      const optionsWithoutExpiry = {
        invitationTokenSecret: 'test-secret',
        frontendBaseUrl: 'http://localhost:3000',
      };

      const mockEmailSender: jest.Mocked<EmailSender> = {
        send: jest.fn().mockResolvedValue({ success: true }),
      };

      const moduleWithDefaults: TestingModule = await Test.createTestingModule({
        providers: [
          InvitationsService,
          { provide: DB_TAG, useValue: mockDb },
          {
            provide: USER_MANAGEMENT_OPTIONS,
            useValue: optionsWithoutExpiry,
          },
          { provide: UsersService, useValue: mockUsersService },
          { provide: EMAIL_SENDER, useValue: mockEmailSender },
        ],
      }).compile();

      const serviceWithDefaults =
        moduleWithDefaults.get<InvitationsService>(InvitationsService);

      mockUsersService.findOne.mockResolvedValue(undefined);
      mockQuery.invitations.findFirst
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(
          createMockInvitation({
            email: 'new@example.com',
            token: 'generated-token',
          })
        );

      await serviceWithDefaults.invite('new@example.com', 'user', 1);

      expect(mockEmailSender.send).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.stringContaining('7 days'),
        })
      );
    });
  });

  describe('checking invitation links', () => {
    it('confirms a valid invitation link', async () => {
      mockQuery.invitations.findFirst.mockResolvedValue(
        createMockInvitation({
          email: 'valid@example.com',
          token: 'valid-token',
        })
      );

      const result = await service.validate('valid-token');

      expect(result.valid).toBe(true);
      expect(result.email).toBe('valid@example.com');
      expect(result.roleId).toBe(MOCK_ROLE_ID);
    });

    it('rejects an unrecognized invitation link', async () => {
      mockQuery.invitations.findFirst.mockResolvedValue(undefined);

      const result = await service.validate('invalid-token');

      expect(result.valid).toBe(false);
    });

    it('rejects an expired invitation link and marks it as expired', async () => {
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

    it('rejects an invitation link that was already used', async () => {
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
    it('new user provides their details and gains an account', async () => {
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

    it('new user can join without providing their name', async () => {
      const mockUser = {
        id: 3,
        email: 'noname@example.com',
        password: 'hash',
        firstName: null,
        lastName: null,
      };

      mockQuery.invitations.findFirst.mockResolvedValue(
        createMockInvitation({
          email: 'noname@example.com',
          token: 'valid-token',
        })
      );
      mockUsersService.create.mockResolvedValue(mockUser);

      const result = await service.accept('valid-token', 'password123');

      expect(mockUsersService.create).toHaveBeenCalledWith({
        email: 'noname@example.com',
        password: 'password123',
        firstName: null,
        lastName: null,
      });
      expect(result).toEqual(mockUser);
    });

    it('rejects joining with an invalid invitation link', async () => {
      mockQuery.invitations.findFirst.mockResolvedValue(undefined);

      await expect(service.accept('invalid-token', 'password')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('listing invitations', () => {
    it('never exposes invitation tokens in the response', async () => {
      const inv1 = createMockInvitation({
        id: 1,
        email: 'a@test.com',
        token: 'secret-token-1',
      });
      const inv2 = createMockInvitation({
        id: 2,
        email: 'b@test.com',
        token: 'secret-token-2',
        status: INVITATION_STATUS.EXPIRED,
      });
      mockQuery.invitations.findMany.mockResolvedValue([inv1, inv2]);

      const results = await service.findAll();

      expect(results).toHaveLength(2);
      for (const result of results) {
        expect(result).not.toHaveProperty('token');
      }
      expect(results[0].email).toBe('a@test.com');
      expect(results[1].email).toBe('b@test.com');
    });

    it('excludes accepted invitations from the list', async () => {
      const pending = createMockInvitation({
        id: 1,
        email: 'pending@test.com',
      });
      const accepted = createMockInvitation({
        id: 2,
        email: 'accepted@test.com',
        status: INVITATION_STATUS.ACCEPTED,
      });
      const expired = createMockInvitation({
        id: 3,
        email: 'expired@test.com',
        status: INVITATION_STATUS.EXPIRED,
      });
      mockQuery.invitations.findMany.mockResolvedValue([
        pending,
        accepted,
        expired,
      ]);

      const results = await service.findAll();

      expect(results).toHaveLength(2);
      expect(results.map((r) => r.email)).toEqual([
        'pending@test.com',
        'expired@test.com',
      ]);
    });

    it('marks overdue pending invitations as expired when listing', async () => {
      const stale = createMockInvitation({
        id: 1,
        tokenExpiry: Date.now() - 86400000,
        status: INVITATION_STATUS.PENDING,
      });
      mockQuery.invitations.findMany.mockResolvedValue([stale]);

      const results = await service.findAll();

      expect(results[0].status).toBe(INVITATION_STATUS.EXPIRED);
      expect(mockDb.update).toHaveBeenCalledWith(invitations);
    });

    it('handles having no invitations gracefully', async () => {
      mockQuery.invitations.findMany.mockResolvedValue([]);

      const results = await service.findAll();

      expect(results).toEqual([]);
    });
  });

  describe('cancelling invitations', () => {
    it('removes a pending invitation when cancelled', async () => {
      mockQuery.invitations.findFirst.mockResolvedValue(
        createMockInvitation({ id: 5 })
      );

      await service.cancel(5);

      expect(mockDb.delete).toHaveBeenCalledWith(invitations);
    });

    it('cancels an accepted invitation', async () => {
      mockQuery.invitations.findFirst.mockResolvedValue(
        createMockInvitation({ id: 3, status: INVITATION_STATUS.ACCEPTED })
      );

      await service.cancel(3);

      expect(mockDb.delete).toHaveBeenCalledWith(invitations);
    });

    it('cancels an expired invitation', async () => {
      mockQuery.invitations.findFirst.mockResolvedValue(
        createMockInvitation({
          id: 4,
          status: INVITATION_STATUS.EXPIRED,
          tokenExpiry: Date.now() - 86400000,
        })
      );

      await service.cancel(4);

      expect(mockDb.delete).toHaveBeenCalledWith(invitations);
    });

    it('reports when trying to cancel an invitation that does not exist', async () => {
      mockQuery.invitations.findFirst.mockResolvedValue(undefined);

      await expect(service.cancel(999)).rejects.toThrow(NotFoundException);
    });
  });
});
