import { Test } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { UsersService } from '@open-kingdom/shared-backend-data-access-users';
import { UserManagementController } from './user-management.controller.js';
import { InvitationsService } from './invitations/invitations.service.js';

const mockUsersService = {
  findAll: jest.fn(),
  delete: jest.fn(),
};

const mockInvitationsService = {
  invite: jest.fn(),
};

describe('UserManagementController', () => {
  let controller: UserManagementController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      controllers: [UserManagementController],
      providers: [
        { provide: UsersService, useValue: mockUsersService },
        { provide: InvitationsService, useValue: mockInvitationsService },
      ],
    }).compile();

    controller = module.get(UserManagementController);
  });

  describe('listing users', () => {
    it('returns all users in the system', async () => {
      const users = [
        {
          id: 1,
          email: 'admin@example.com',
          firstName: 'Admin',
          lastName: 'User',
        },
        {
          id: 2,
          email: 'user@example.com',
          firstName: 'Regular',
          lastName: 'User',
        },
      ];
      mockUsersService.findAll.mockResolvedValue(users);

      const result = await controller.list();

      expect(result).toEqual(users);
      expect(mockUsersService.findAll).toHaveBeenCalled();
    });
  });

  describe('deleting users', () => {
    const mockRequest = (userId: number) => ({
      user: { id: userId, email: 'admin@example.com', role: 'admin' },
    });

    it('removes a user from the system', async () => {
      mockUsersService.delete.mockResolvedValue(undefined);

      const result = await controller.delete(2, mockRequest(1) as never);

      expect(result).toEqual({ success: true });
      expect(mockUsersService.delete).toHaveBeenCalledWith(2);
    });

    it('prevents administrators from deleting themselves', async () => {
      await expect(
        controller.delete(1, mockRequest(1) as never)
      ).rejects.toThrow(ForbiddenException);
      await expect(
        controller.delete(1, mockRequest(1) as never)
      ).rejects.toThrow('Cannot delete yourself');
    });

    it('allows deleting other users', async () => {
      mockUsersService.delete.mockResolvedValue(undefined);

      await expect(
        controller.delete(99, mockRequest(1) as never)
      ).resolves.not.toThrow();
    });
  });

  describe('inviting new users', () => {
    const mockRequest = {
      user: { id: 1, email: 'admin@example.com', role: 'admin' },
    };

    const inviteDto = {
      email: 'newuser@example.com',
      firstName: 'New',
      lastName: 'User',
      role: 'user' as const,
    };

    it('sends an invitation to join', async () => {
      mockInvitationsService.invite.mockResolvedValue({
        success: true,
        invitationId: 1,
      });

      const result = await controller.invite(inviteDto, mockRequest as never);

      expect(result).toEqual({ success: true, invitationId: 1 });
      expect(mockInvitationsService.invite).toHaveBeenCalledWith(inviteDto, 1);
    });

    it('passes the inviting user ID to track who sent the invitation', async () => {
      mockInvitationsService.invite.mockResolvedValue({
        success: true,
        invitationId: 1,
      });

      await controller.invite(inviteDto, { user: { id: 42 } } as never);

      expect(mockInvitationsService.invite).toHaveBeenCalledWith(inviteDto, 42);
    });
  });
});
