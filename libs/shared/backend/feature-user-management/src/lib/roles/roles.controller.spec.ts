import { Test } from '@nestjs/testing';
import { RolesController } from './roles.controller.js';
import { RolesService } from './roles.service.js';

const mockRolesService = {
  list: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
};

describe('RolesController', () => {
  let controller: RolesController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      controllers: [RolesController],
      providers: [{ provide: RolesService, useValue: mockRolesService }],
    }).compile();

    controller = module.get(RolesController);
  });

  describe('viewing available roles', () => {
    it('shows all defined custom roles in the organization', async () => {
      const roles = [
        { id: 1, name: 'manager', description: 'Manager role' },
        { id: 2, name: 'editor', description: 'Editor role' },
      ];
      mockRolesService.list.mockResolvedValue(roles);

      const result = await controller.list();

      expect(result).toEqual(roles);
      expect(mockRolesService.list).toHaveBeenCalled();
    });

    it('shows an empty list when no custom roles have been created', async () => {
      mockRolesService.list.mockResolvedValue([]);

      const result = await controller.list();

      expect(result).toEqual([]);
    });
  });

  describe('defining new roles', () => {
    const newRole = {
      name: 'manager',
      description: 'Manager role',
      permissions: ['read', 'write'],
    };

    const adminUser = {
      user: { id: 1, email: 'admin@example.com', role: 'admin' },
    } as never;

    it('allows admins to define custom roles with specific permissions', async () => {
      const createdRole = { id: 1, ...newRole, createdBy: 1 };
      mockRolesService.create.mockResolvedValue(createdRole);

      const result = await controller.create(newRole, adminUser);

      expect(result).toEqual(createdRole);
      expect(mockRolesService.create).toHaveBeenCalledWith(newRole, 1);
    });

    it('records which admin created the role for audit purposes', async () => {
      mockRolesService.create.mockResolvedValue({ id: 1 });

      await controller.create(newRole, adminUser);

      expect(mockRolesService.create).toHaveBeenCalledWith(
        newRole,
        adminUser.user.id
      );
    });
  });

  describe('removing roles', () => {
    it('allows admins to remove roles that are no longer needed', async () => {
      mockRolesService.delete.mockResolvedValue(undefined);

      const result = await controller.delete(1);

      expect(result).toEqual({ success: true });
      expect(mockRolesService.delete).toHaveBeenCalledWith(1);
    });
  });
});
