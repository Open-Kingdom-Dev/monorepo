import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';

import { PermissionsController } from './permissions.controller';
import { PermissionsService } from '../services';

describe('PermissionsController', () => {
  let controller: PermissionsController;
  let mockPermissionsService: jest.Mocked<PermissionsService>;

  const mockPermission = {
    id: 1,
    resource: 'articles',
    action: 'publish',
    description: 'Publish articles',
  };

  beforeEach(async () => {
    mockPermissionsService = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<PermissionsService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PermissionsController],
      providers: [
        { provide: PermissionsService, useValue: mockPermissionsService },
      ],
    }).compile();

    controller = module.get<PermissionsController>(PermissionsController);
  });

  describe('listing permissions', () => {
    it('shows all available permissions', async () => {
      mockPermissionsService.findAll.mockResolvedValue([mockPermission]);

      const result = await controller.findAll();

      expect(result).toEqual([mockPermission]);
    });
  });

  describe('viewing a permission', () => {
    it('shows the requested permission', async () => {
      mockPermissionsService.findById.mockResolvedValue(mockPermission);

      const result = await controller.findOne(1);

      expect(result).toEqual(mockPermission);
    });

    it('reports when the permission does not exist', async () => {
      mockPermissionsService.findById.mockRejectedValue(
        new NotFoundException('Permission not found')
      );

      await expect(controller.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('creating a permission', () => {
    it('creates a permission with resource and action', async () => {
      mockPermissionsService.create.mockResolvedValue(mockPermission);

      const result = await controller.create({
        resource: 'articles',
        action: 'publish',
        description: 'Publish articles',
      });

      expect(result).toEqual(mockPermission);
      expect(mockPermissionsService.create).toHaveBeenCalledWith(
        'articles',
        'publish',
        'Publish articles'
      );
    });
  });

  describe('removing a permission', () => {
    it('removes the permission and confirms success', async () => {
      mockPermissionsService.delete.mockResolvedValue(undefined);

      const result = await controller.delete(1);

      expect(result).toEqual({
        message: 'Permission deleted successfully',
      });
      expect(mockPermissionsService.delete).toHaveBeenCalledWith(1);
    });

    it('prevents deleting permissions assigned to roles', async () => {
      mockPermissionsService.delete.mockRejectedValue(
        new BadRequestException(
          'Cannot delete a permission that is assigned to roles'
        )
      );

      await expect(controller.delete(1)).rejects.toThrow(BadRequestException);
    });
  });
});
