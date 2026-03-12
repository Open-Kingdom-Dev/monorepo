import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';

import { RolesController } from './roles.controller';
import { RolesService, PermissionsService } from '../services';

describe('RolesController', () => {
  let controller: RolesController;
  let mockRolesService: jest.Mocked<RolesService>;
  let mockPermissionsService: jest.Mocked<PermissionsService>;

  const mockRole = {
    id: 1,
    name: 'editor',
    description: 'Content editor',
    isSystem: 0,
    createdAt: Date.now(),
  };

  const mockPermission = {
    id: 1,
    resource: 'articles',
    action: 'publish',
    description: null,
  };

  beforeEach(async () => {
    mockRolesService = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<RolesService>;

    mockPermissionsService = {
      findByRole: jest.fn(),
      setRolePermissions: jest.fn(),
    } as unknown as jest.Mocked<PermissionsService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RolesController],
      providers: [
        { provide: RolesService, useValue: mockRolesService },
        { provide: PermissionsService, useValue: mockPermissionsService },
      ],
    }).compile();

    controller = module.get<RolesController>(RolesController);
  });

  describe('listing roles', () => {
    it('shows all available roles', async () => {
      mockRolesService.findAll.mockResolvedValue([mockRole]);

      const result = await controller.findAll();

      expect(result).toEqual([mockRole]);
    });
  });

  describe('viewing a role', () => {
    it('shows the requested role', async () => {
      mockRolesService.findById.mockResolvedValue(mockRole);

      const result = await controller.findOne(1);

      expect(result).toEqual(mockRole);
    });

    it('reports when the role does not exist', async () => {
      mockRolesService.findById.mockRejectedValue(
        new NotFoundException('Role not found')
      );

      await expect(controller.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('creating a role', () => {
    it('creates a role with the provided details', async () => {
      mockRolesService.create.mockResolvedValue(mockRole);

      const result = await controller.create({
        name: 'editor',
        description: 'Content editor',
      });

      expect(result).toEqual(mockRole);
      expect(mockRolesService.create).toHaveBeenCalledWith(
        'editor',
        'Content editor'
      );
    });
  });

  describe('updating a role', () => {
    it('updates the role with new details', async () => {
      const updated = { ...mockRole, description: 'Updated description' };
      mockRolesService.update.mockResolvedValue(updated);

      const result = await controller.update(1, {
        description: 'Updated description',
      });

      expect(result).toEqual(updated);
      expect(mockRolesService.update).toHaveBeenCalledWith(1, {
        description: 'Updated description',
      });
    });
  });

  describe('removing a role', () => {
    it('removes the role and confirms success', async () => {
      mockRolesService.delete.mockResolvedValue(undefined);

      const result = await controller.delete(1);

      expect(result).toEqual({ message: 'Role deleted successfully' });
      expect(mockRolesService.delete).toHaveBeenCalledWith(1);
    });

    it('prevents deleting system roles', async () => {
      mockRolesService.delete.mockRejectedValue(
        new BadRequestException('Cannot delete a system role')
      );

      await expect(controller.delete(1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('managing role permissions', () => {
    it('shows permissions assigned to a role', async () => {
      mockPermissionsService.findByRole.mockResolvedValue([mockPermission]);

      const result = await controller.getPermissions(1);

      expect(result).toEqual([mockPermission]);
      expect(mockPermissionsService.findByRole).toHaveBeenCalledWith(1);
    });

    it('replaces all permissions for a role', async () => {
      mockRolesService.findById.mockResolvedValue(mockRole);
      mockPermissionsService.setRolePermissions.mockResolvedValue(undefined);

      const result = await controller.setPermissions(1, {
        permissionIds: [1, 2, 3],
      });

      expect(result).toEqual({
        message: 'Role permissions updated successfully',
      });
      expect(mockRolesService.findById).toHaveBeenCalledWith(1);
      expect(mockPermissionsService.setRolePermissions).toHaveBeenCalledWith(
        1,
        [1, 2, 3]
      );
    });

    it('verifies the role exists before updating permissions', async () => {
      mockRolesService.findById.mockRejectedValue(
        new NotFoundException('Role not found')
      );

      await expect(
        controller.setPermissions(999, { permissionIds: [1] })
      ).rejects.toThrow(NotFoundException);

      expect(mockPermissionsService.setRolePermissions).not.toHaveBeenCalled();
    });
  });
});
