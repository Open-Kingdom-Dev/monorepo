import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

import { UsersService } from '@open-kingdom/shared-backend-data-access-users';
import { UserManagementService } from './user-management.service';
import { UserRolesService } from './user-roles.service';

describe('UserManagementService', () => {
  let service: UserManagementService;
  let mockUsersService: jest.Mocked<UsersService>;
  let mockUserRolesService: { findPrimaryRole: jest.Mock };

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    password: 'hashed-password',
    firstName: 'Test',
    lastName: 'User',
  };

  beforeEach(async () => {
    mockUsersService = {
      findAll: jest.fn(),
      findById: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<UsersService>;

    mockUserRolesService = {
      findPrimaryRole: jest.fn().mockResolvedValue('user'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserManagementService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: UserRolesService, useValue: mockUserRolesService },
      ],
    }).compile();

    service = module.get<UserManagementService>(UserManagementService);
  });

  describe('listing users', () => {
    it('hides sensitive information from the list', async () => {
      mockUsersService.findAll.mockResolvedValue([mockUser]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]).not.toHaveProperty('password');
      expect(result[0].email).toBe('test@example.com');
    });

    it("shows each user's assigned role", async () => {
      mockUsersService.findAll.mockResolvedValue([mockUser]);

      const result = await service.findAll();

      expect(result[0].role).toBe('user');
    });
  });

  describe('viewing a user', () => {
    it('hides sensitive information', async () => {
      mockUsersService.findById.mockResolvedValue(mockUser);

      const result = await service.findById(1);

      expect(result).not.toHaveProperty('password');
      expect(result.email).toBe('test@example.com');
    });

    it("shows the user's assigned role", async () => {
      mockUsersService.findById.mockResolvedValue(mockUser);

      const result = await service.findById(1);

      expect(result.role).toBe('user');
    });

    it('reports when the user does not exist', async () => {
      mockUsersService.findById.mockResolvedValue(undefined);

      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('removing a user', () => {
    it('removes the user from the system', async () => {
      mockUsersService.findById.mockResolvedValue(mockUser);
      mockUsersService.delete.mockResolvedValue(undefined);

      await service.delete(1, 2);

      expect(mockUsersService.delete).toHaveBeenCalledWith(1);
    });

    it('prevents users from removing themselves', async () => {
      await expect(service.delete(1, 1)).rejects.toThrow(ForbiddenException);
      expect(mockUsersService.delete).not.toHaveBeenCalled();
    });

    it('reports when the user does not exist', async () => {
      mockUsersService.findById.mockResolvedValue(undefined);

      await expect(service.delete(999, 1)).rejects.toThrow(NotFoundException);
      expect(mockUsersService.delete).not.toHaveBeenCalled();
    });
  });
});
