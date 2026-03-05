import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';

import { DB_TAG } from '@open-kingdom/shared-poly-util-constants';
import { PermissionsService } from './permissions.service';
import type { Permission } from '../schemas/permissions.schema';

interface MockQuery {
  permissions: {
    findFirst: jest.Mock;
    findMany: jest.Mock;
  };
  role_permissions: {
    findFirst: jest.Mock;
  };
}

interface MockDb {
  query: MockQuery;
  select: jest.Mock;
  insert: jest.Mock;
  delete: jest.Mock;
  transaction: jest.Mock;
}

const createMockPermission = (
  overrides: Partial<Permission> = {}
): Permission => ({
  id: 1,
  resource: 'users',
  action: 'read',
  description: 'View user profiles',
  ...overrides,
});

const createSelectChain = (result: unknown[] = []) => ({
  from: jest.fn().mockReturnValue({
    where: jest.fn().mockResolvedValue(result),
    innerJoin: jest.fn().mockReturnValue({
      where: jest.fn().mockResolvedValue(result),
      innerJoin: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(result),
      }),
    }),
  }),
});

describe('PermissionsService', () => {
  let service: PermissionsService;
  let mockDb: MockDb;
  let mockQuery: MockQuery;

  beforeEach(async () => {
    mockQuery = {
      permissions: {
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
      role_permissions: {
        findFirst: jest.fn().mockResolvedValue(undefined),
      },
    };

    mockDb = {
      query: mockQuery,
      select: jest.fn().mockReturnValue(createSelectChain()),
      insert: jest.fn().mockReturnValue({
        values: jest.fn().mockResolvedValue(undefined),
      }),
      delete: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      }),
      transaction: jest.fn().mockImplementation((fn) => {
        const tx = {
          delete: jest.fn().mockReturnValue({
            where: jest.fn(),
          }),
          insert: jest.fn().mockReturnValue({
            values: jest.fn(),
          }),
        };
        return fn(tx);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [PermissionsService, { provide: DB_TAG, useValue: mockDb }],
    }).compile();

    service = module.get<PermissionsService>(PermissionsService);
  });

  describe('listing permissions', () => {
    it('returns all permissions', async () => {
      const perms = [
        createMockPermission(),
        createMockPermission({ id: 2, resource: 'roles', action: 'read' }),
      ];
      mockQuery.permissions.findMany.mockResolvedValue(perms);

      const result = await service.findAll();

      expect(result).toEqual(perms);
    });
  });

  describe('finding permissions', () => {
    it('returns the permission when it exists', async () => {
      const perm = createMockPermission();
      mockQuery.permissions.findFirst.mockResolvedValue(perm);

      const result = await service.findById(1);

      expect(result).toEqual(perm);
    });

    it('reports when the permission does not exist', async () => {
      mockQuery.permissions.findFirst.mockResolvedValue(undefined);

      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });

    it('finds a permission by resource and action', async () => {
      const perm = createMockPermission();
      mockQuery.permissions.findFirst.mockResolvedValue(perm);

      const result = await service.findByResourceAction('users', 'read');

      expect(result).toEqual(perm);
    });
  });

  describe('finding permissions by role', () => {
    it('returns permissions assigned to a role', async () => {
      const perms = [
        createMockPermission({ id: 1, resource: 'users', action: 'read' }),
        createMockPermission({ id: 2, resource: 'roles', action: 'read' }),
      ];
      mockDb.select.mockReturnValueOnce(createSelectChain(perms));

      const result = await service.findByRole(1);

      expect(result).toEqual(perms);
    });

    it('returns nothing when the role has no permissions', async () => {
      mockDb.select.mockReturnValueOnce(createSelectChain([]));

      const result = await service.findByRole(1);

      expect(result).toEqual([]);
    });
  });

  describe('resolving user permissions', () => {
    it("collects unique permissions across all of a user's roles", async () => {
      const rows = [
        { resource: 'users', action: 'read' },
        { resource: 'users', action: 'read' },
        { resource: 'roles', action: 'read' },
      ];
      mockDb.select.mockReturnValue(createSelectChain(rows));

      const result = await service.findByUserId(1);

      expect(result).toContain('users:read');
      expect(result).toContain('roles:read');
      expect(result).toHaveLength(2);
    });
  });

  describe('creating permissions', () => {
    it('creates a new permission', async () => {
      const perm = createMockPermission();
      mockQuery.permissions.findFirst
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(perm);

      const result = await service.create(
        'users',
        'read',
        'View user profiles'
      );

      expect(mockDb.insert).toHaveBeenCalled();
      expect(result).toEqual(perm);
    });

    it('rejects creating a permission that already exists', async () => {
      mockQuery.permissions.findFirst.mockResolvedValue(createMockPermission());

      await expect(
        service.create('users', 'read', 'duplicate')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleting permissions', () => {
    it('deletes a permission not assigned to any role', async () => {
      mockQuery.permissions.findFirst.mockResolvedValue(createMockPermission());
      mockQuery.role_permissions.findFirst.mockResolvedValue(undefined);

      await service.delete(1);

      expect(mockDb.delete).toHaveBeenCalled();
    });

    it('prevents deleting a permission assigned to roles', async () => {
      mockQuery.permissions.findFirst.mockResolvedValue(createMockPermission());
      mockQuery.role_permissions.findFirst.mockResolvedValue({
        id: 1,
        roleId: 1,
        permissionId: 1,
      });

      await expect(service.delete(1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('setting role permissions', () => {
    it('replaces all permissions for a role', async () => {
      await service.setRolePermissions(1, [2, 3]);

      expect(mockDb.transaction).toHaveBeenCalled();
    });

    it('clears all permissions when given an empty list', async () => {
      const txDelete = jest.fn().mockReturnValue({
        where: jest.fn(),
      });
      mockDb.transaction.mockImplementation((fn) => {
        const tx = {
          delete: txDelete,
          insert: jest.fn().mockReturnValue({
            values: jest.fn(),
          }),
        };
        return fn(tx);
      });

      await service.setRolePermissions(1, []);

      expect(txDelete).toHaveBeenCalled();
    });
  });
});
