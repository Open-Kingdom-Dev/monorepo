import { Test } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { DB_TAG } from '@open-kingdom/shared-poly-util-constants';
import { RolesService } from './roles.service.js';

const mockDb = {
  select: jest.fn(),
  insert: jest.fn(),
  delete: jest.fn(),
};

describe('RolesService', () => {
  let service: RolesService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [RolesService, { provide: DB_TAG, useValue: mockDb }],
    }).compile();

    service = module.get(RolesService);
  });

  describe('listing roles', () => {
    it('returns all custom roles in the system', async () => {
      const roles = [
        {
          id: 1,
          name: 'Editor',
          description: 'Can edit content',
          permissions: null,
          createdAt: 1000,
          createdBy: 1,
        },
        {
          id: 2,
          name: 'Viewer',
          description: 'Read-only access',
          permissions: null,
          createdAt: 2000,
          createdBy: 1,
        },
      ];

      mockDb.select.mockReturnValue({
        from: jest.fn().mockResolvedValue(roles),
      });

      const result = await service.list();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Editor');
      expect(result[1].name).toBe('Viewer');
    });

    it('returns an empty list when no custom roles exist', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockResolvedValue([]),
      });

      const result = await service.list();

      expect(result).toEqual([]);
    });

    it('includes all role details in the response', async () => {
      const role = {
        id: 1,
        name: 'Manager',
        description: 'Team management role',
        permissions: JSON.stringify(['read', 'write']),
        createdAt: 1703952000,
        createdBy: 42,
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockResolvedValue([role]),
      });

      const result = await service.list();

      expect(result[0]).toEqual({
        id: 1,
        name: 'Manager',
        description: 'Team management role',
        permissions: JSON.stringify(['read', 'write']),
        createdAt: 1703952000,
        createdBy: 42,
      });
    });
  });

  describe('creating roles', () => {
    beforeEach(() => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });
    });

    it('creates a new role with the given name', async () => {
      const newRole = {
        id: 1,
        name: 'Editor',
        description: null,
        permissions: null,
        createdAt: 1000,
        createdBy: 1,
      };

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([newRole]),
        }),
      });

      const result = await service.create({ name: 'Editor' }, 1);

      expect(result.name).toBe('Editor');
      expect(result.id).toBe(1);
    });

    it('stores the description when provided', async () => {
      const newRole = {
        id: 1,
        name: 'Editor',
        description: 'Content editing role',
        permissions: null,
        createdAt: 1000,
        createdBy: 1,
      };

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([newRole]),
        }),
      });

      const result = await service.create(
        { name: 'Editor', description: 'Content editing role' },
        1
      );

      expect(result.description).toBe('Content editing role');
    });

    it('tracks who created the role', async () => {
      const newRole = {
        id: 1,
        name: 'Editor',
        description: null,
        permissions: null,
        createdAt: 1000,
        createdBy: 42,
      };

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([newRole]),
        }),
      });

      const result = await service.create({ name: 'Editor' }, 42);

      expect(result.createdBy).toBe(42);
    });

    it('prevents creating roles with duplicate names', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ id: 1, name: 'Editor' }]),
        }),
      });

      await expect(service.create({ name: 'Editor' }, 1)).rejects.toThrow(
        ConflictException
      );
      await expect(service.create({ name: 'Editor' }, 1)).rejects.toThrow(
        'Role with this name already exists'
      );
    });
  });

  describe('deleting roles', () => {
    it('removes a role from the system', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ id: 1, name: 'Editor' }]),
        }),
      });

      mockDb.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      });

      await expect(service.delete(1)).resolves.not.toThrow();
      expect(mockDb.delete).toHaveBeenCalled();
    });

    it('fails when trying to delete a role that does not exist', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      await expect(service.delete(999)).rejects.toThrow(NotFoundException);
      await expect(service.delete(999)).rejects.toThrow('Role not found');
    });
  });
});
