import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';

import { InvitationsController } from './invitations.controller';
import { InvitationsService } from '../services';
import type { AuthenticatedRequest } from '../types';

describe('InvitationsController', () => {
  let controller: InvitationsController;
  let mockInvitationsService: jest.Mocked<InvitationsService>;

  beforeEach(async () => {
    mockInvitationsService = {
      invite: jest.fn(),
      validate: jest.fn(),
      accept: jest.fn(),
    } as unknown as jest.Mocked<InvitationsService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvitationsController],
      providers: [
        { provide: InvitationsService, useValue: mockInvitationsService },
      ],
    }).compile();

    controller = module.get<InvitationsController>(InvitationsController);
  });

  describe('sending invitations', () => {
    it('invites a user with the specified role', async () => {
      // Service returns InvitationResponse (without token)
      const mockInvitationResponse = {
        id: 1,
        email: 'new@example.com',
        tokenExpiry: Date.now() + 86400000,
        invitedBy: 1,
        invitedAt: Date.now(),
        role: 'user',
        status: 'pending',
      };

      mockInvitationsService.invite.mockResolvedValue(
        mockInvitationResponse as never
      );

      const mockRequest = {
        user: { id: 1, email: 'admin@example.com' },
      } as AuthenticatedRequest;
      const result = await controller.invite(
        { email: 'new@example.com', role: 'user' },
        mockRequest
      );

      expect(mockInvitationsService.invite).toHaveBeenCalledWith(
        'new@example.com',
        'user',
        1
      );
      // Token is excluded by service, not controller
      expect(result).not.toHaveProperty('token');
      expect(result).toEqual(mockInvitationResponse);
    });

    it('assigns guest role by default', async () => {
      const mockInvitation = {
        id: 1,
        email: 'new@example.com',
        role: 'guest',
      };

      mockInvitationsService.invite.mockResolvedValue(mockInvitation as never);

      const mockRequest = {
        user: { id: 1, email: 'admin@example.com' },
      } as AuthenticatedRequest;
      await controller.invite({ email: 'new@example.com' }, mockRequest);

      expect(mockInvitationsService.invite).toHaveBeenCalledWith(
        'new@example.com',
        'guest',
        1
      );
    });
  });

  describe('checking invitation tokens', () => {
    it('confirms whether an invitation token is valid', async () => {
      mockInvitationsService.validate.mockResolvedValue({
        valid: true,
        email: 'test@example.com',
        role: 'user',
      });

      const result = await controller.validate('token123');

      expect(mockInvitationsService.validate).toHaveBeenCalledWith('token123');
      expect(result.valid).toBe(true);
    });
  });

  describe('accepting invitations', () => {
    it('creates the account and hides sensitive information', async () => {
      const mockUser = {
        id: 1,
        email: 'new@example.com',
        password: 'hashed',
        firstName: 'John',
        lastName: 'Doe',
      };

      mockInvitationsService.accept.mockResolvedValue(mockUser);

      const result = await controller.accept({
        token: 'token123',
        password: 'newPassword',
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(result).not.toHaveProperty('password');
      expect(result.email).toBe('new@example.com');
    });

    it('rejects invalid invitation tokens', async () => {
      mockInvitationsService.accept.mockRejectedValue(
        new BadRequestException('Invalid token')
      );

      await expect(
        controller.accept({ token: 'invalid', password: 'pass' })
      ).rejects.toThrow(BadRequestException);
    });
  });
});
