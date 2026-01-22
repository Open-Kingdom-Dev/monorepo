import { Test } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { UsersService } from '@open-kingdom/shared-backend-data-access-users';

import { UsersController } from './users.controller';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<
    Pick<UsersService, 'findAll' | 'findById' | 'delete'>
  >;

  const mockUsers = [
    {
      id: 1,
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      password: 'hashed',
      invitedBy: null,
    },
    {
      id: 2,
      email: 'user@example.com',
      firstName: 'Regular',
      lastName: 'User',
      role: 'user',
      password: 'hashed',
      invitedBy: 1,
    },
  ];

  beforeEach(async () => {
    jest.clearAllMocks();

    const mockUsersService = {
      findAll: jest.fn(),
      findById: jest.fn(),
      delete: jest.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();

    controller = module.get(UsersController);
    usersService = mockUsersService;
  });

  describe('listing users', () => {
    it('returns all registered users', async () => {
      usersService.findAll.mockResolvedValue(mockUsers);

      const result = await controller.findAll();

      expect(result).toHaveLength(2);
      expect(result[0].email).toBe('admin@example.com');
    });

    it('excludes sensitive data like passwords', async () => {
      usersService.findAll.mockResolvedValue(mockUsers);

      const result = await controller.findAll();

      expect(result[0]).not.toHaveProperty('password');
      expect(result[0]).toHaveProperty('email');
      expect(result[0]).toHaveProperty('firstName');
    });

    it('returns an empty list when no users exist', async () => {
      usersService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toHaveLength(0);
    });
  });

  describe('viewing a specific user', () => {
    it('returns the requested user', async () => {
      usersService.findById.mockResolvedValue(mockUsers[1]);

      const result = await controller.findOne(2);

      expect(result.id).toBe(2);
      expect(result.email).toBe('user@example.com');
    });

    it('excludes password from the response', async () => {
      usersService.findById.mockResolvedValue(mockUsers[1]);

      const result = await controller.findOne(2);

      expect(result).not.toHaveProperty('password');
    });

    it('reports when user is not found', async () => {
      usersService.findById.mockResolvedValue(undefined);

      await expect(controller.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleting users', () => {
    const mockRequest = {
      user: { id: 1, email: 'admin@example.com', role: 'admin' },
    };

    it('removes a user from the system', async () => {
      usersService.delete.mockResolvedValue(true);

      const result = await controller.delete(2, mockRequest as never);

      expect(result.success).toBe(true);
      expect(result.message).toBe('User deleted successfully');
    });

    it('prevents users from deleting themselves', async () => {
      await expect(controller.delete(1, mockRequest as never)).rejects.toThrow(
        ForbiddenException
      );
    });

    it('reports when user to delete is not found', async () => {
      usersService.delete.mockResolvedValue(false);

      const result = await controller.delete(999, mockRequest as never);

      expect(result.success).toBe(false);
      expect(result.message).toBe('User not found');
    });
  });
});
