import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

import { UserManagementService } from '../services';
import { UsersController } from './users.controller';
import type { AuthenticatedRequest } from '../types';

describe('UsersController', () => {
  let controller: UsersController;
  let mockUserManagementService: jest.Mocked<UserManagementService>;

  const mockUsers = [
    { id: 1, email: 'user1@example.com', firstName: 'John', lastName: 'Doe' },
    { id: 2, email: 'user2@example.com', firstName: 'Jane', lastName: 'Doe' },
  ];

  beforeEach(async () => {
    mockUserManagementService = {
      findAll: jest.fn(),
      findById: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<UserManagementService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UserManagementService, useValue: mockUserManagementService },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  describe('listing users', () => {
    it('shows all users in the system', async () => {
      mockUserManagementService.findAll.mockResolvedValue(mockUsers);

      const result = await controller.findAll();

      expect(result).toHaveLength(2);
      expect(result[0].email).toBe('user1@example.com');
    });
  });

  describe('viewing a user', () => {
    it('shows the requested user', async () => {
      mockUserManagementService.findById.mockResolvedValue(mockUsers[0]);

      const result = await controller.findOne(1);

      expect(result.id).toBe(1);
    });

    it('reports when the user does not exist', async () => {
      mockUserManagementService.findById.mockRejectedValue(
        new NotFoundException('User not found')
      );

      await expect(controller.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('removing a user', () => {
    const mockRequest = {
      user: { id: 1, email: 'admin@example.com' },
    } as AuthenticatedRequest;

    it('removes the user and confirms success', async () => {
      mockUserManagementService.delete.mockResolvedValue(undefined);

      const result = await controller.delete(2, mockRequest);

      expect(mockUserManagementService.delete).toHaveBeenCalledWith(2, 1);
      expect(result.message).toBe('User deleted successfully');
    });

    it('prevents users from removing themselves', async () => {
      mockUserManagementService.delete.mockRejectedValue(
        new ForbiddenException('Cannot delete your own account')
      );

      await expect(controller.delete(1, mockRequest)).rejects.toThrow(
        ForbiddenException
      );
    });

    it('reports when the user does not exist', async () => {
      mockUserManagementService.delete.mockRejectedValue(
        new NotFoundException('User not found')
      );

      await expect(controller.delete(999, mockRequest)).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
