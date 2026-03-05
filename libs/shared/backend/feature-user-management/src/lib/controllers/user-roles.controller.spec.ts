import { Test, TestingModule } from '@nestjs/testing';

import { UserRolesController } from './user-roles.controller';
import { UserRolesService } from '../services';
import type { AuthenticatedRequest } from '../types';

describe('UserRolesController', () => {
  let controller: UserRolesController;
  let mockUserRolesService: jest.Mocked<UserRolesService>;

  const mockUserRole = {
    id: 1,
    userId: 10,
    roleId: 2,
    assignedAt: Date.now(),
    assignedBy: 1,
    role: {
      id: 2,
      name: 'editor',
      description: 'Content editor',
      isSystem: 0,
      createdAt: Date.now(),
    },
  };

  beforeEach(async () => {
    mockUserRolesService = {
      findByUserId: jest.fn(),
      setRoles: jest.fn(),
      assignRole: jest.fn(),
      removeRole: jest.fn(),
    } as unknown as jest.Mocked<UserRolesService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserRolesController],
      providers: [
        { provide: UserRolesService, useValue: mockUserRolesService },
      ],
    }).compile();

    controller = module.get<UserRolesController>(UserRolesController);
  });

  describe('viewing user roles', () => {
    it('shows all roles assigned to a user', async () => {
      mockUserRolesService.findByUserId.mockResolvedValue([mockUserRole]);

      const result = await controller.findByUser(10);

      expect(result).toEqual([mockUserRole]);
      expect(mockUserRolesService.findByUserId).toHaveBeenCalledWith(10);
    });
  });

  describe('replacing all roles for a user', () => {
    it('replaces all roles and records who made the change', async () => {
      mockUserRolesService.setRoles.mockResolvedValue(undefined);
      const req = { user: { id: 1 } } as AuthenticatedRequest;

      const result = await controller.setRoles(10, { roleIds: [2, 3] }, req);

      expect(result).toEqual({ message: 'User roles updated successfully' });
      expect(mockUserRolesService.setRoles).toHaveBeenCalledWith(10, [2, 3], 1);
    });
  });

  describe('assigning a role', () => {
    it('assigns the role and records who made the assignment', async () => {
      mockUserRolesService.assignRole.mockResolvedValue(undefined);
      const req = { user: { id: 1 } } as AuthenticatedRequest;

      const result = await controller.assignRole(10, { roleId: 2 }, req);

      expect(result).toEqual({ message: 'Role assigned successfully' });
      expect(mockUserRolesService.assignRole).toHaveBeenCalledWith(10, 2, 1);
    });
  });

  describe('removing a role', () => {
    it('removes the role from the user', async () => {
      mockUserRolesService.removeRole.mockResolvedValue(undefined);

      const result = await controller.removeRole(10, 2);

      expect(result).toEqual({ message: 'Role removed successfully' });
      expect(mockUserRolesService.removeRole).toHaveBeenCalledWith(10, 2);
    });
  });
});
