import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';

import { DB_TAG } from '@open-kingdom/shared-poly-util-constants';
import { RolesService } from './roles.service';
import type { Role } from '../schemas/roles.schema';

interface MockQuery {
  roles: {
    findFirst: jest.Mock;
    findMany: jest.Mock;
  };
  user_roles: {
    findFirst: jest.Mock;
  };
}

interface MockDb {
  query: MockQuery;
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
}

const createMockRole = (overrides: Partial<Role> = {}): Role => ({
  id: 1,
  name: 'editor',
  description: 'Can edit content',
  priority: 20,
  isSystem: 0,
  createdAt: Date.now(),
  ...overrides,
});

describe('RolesService', () => {
  let service: RolesService;
  let mockDb: MockDb;
  let mockQuery: MockQuery;

  beforeEach(async () => {
    mockQuery = {
      roles: {
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
      user_roles: {
        findFirst: jest.fn().mockResolvedValue(undefined),
      },
    };

    mockDb = {
      query: mockQuery,
      insert: jest.fn().mockReturnValue({
        values: jest.fn().mockResolvedValue(undefined),
      }),
      update: jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
      }),
      delete: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [RolesService, { provide: DB_TAG, useValue: mockDb }],
    }).compile();

    service = module.get<RolesService>(RolesService);
  });

  describe('listing roles', () => {
    it('returns all roles', async () => {
      const roles = [
        createMockRole(),
        createMockRole({ id: 2, name: 'admin' }),
      ];
      mockQuery.roles.findMany.mockResolvedValue(roles);

      const result = await service.findAll();

      expect(result).toEqual(roles);
    });
  });

  describe('finding a role', () => {
    it('returns the role when it exists', async () => {
      const role = createMockRole();
      mockQuery.roles.findFirst.mockResolvedValue(role);

      const result = await service.findById(1);

      expect(result).toEqual(role);
    });

    it('reports when the role does not exist', async () => {
      mockQuery.roles.findFirst.mockResolvedValue(undefined);

      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });

    it('finds a role by name', async () => {
      const role = createMockRole();
      mockQuery.roles.findFirst.mockResolvedValue(role);

      const result = await service.findByName('editor');

      expect(result).toEqual(role);
    });
  });

  describe('creating roles', () => {
    it('creates a new role', async () => {
      mockQuery.roles.findFirst
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(createMockRole());

      const result = await service.create('editor', 'Can edit content', 20);

      expect(mockDb.insert).toHaveBeenCalled();
      expect(result.name).toBe('editor');
    });

    it('rejects creating a role with a duplicate name', async () => {
      mockQuery.roles.findFirst.mockResolvedValue(createMockRole());

      await expect(service.create('editor', 'duplicate', 20)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('updating roles', () => {
    it('updates a non-system role', async () => {
      const role = createMockRole();
      mockQuery.roles.findFirst.mockResolvedValue(role);

      await service.update(1, { description: 'Updated' });

      expect(mockDb.update).toHaveBeenCalled();
    });

    it('prevents renaming a system role', async () => {
      const systemRole = createMockRole({ isSystem: 1, name: 'admin' });
      mockQuery.roles.findFirst.mockResolvedValue(systemRole);

      await expect(service.update(1, { name: 'superadmin' })).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('deleting roles', () => {
    it('deletes a non-system role with no users', async () => {
      const role = createMockRole();
      mockQuery.roles.findFirst.mockResolvedValue(role);
      mockQuery.user_roles.findFirst.mockResolvedValue(undefined);

      await service.delete(1);

      expect(mockDb.delete).toHaveBeenCalled();
    });

    it('prevents deleting a system role', async () => {
      const systemRole = createMockRole({ isSystem: 1 });
      mockQuery.roles.findFirst.mockResolvedValue(systemRole);

      await expect(service.delete(1)).rejects.toThrow(BadRequestException);
    });

    it('prevents deleting a role assigned to users', async () => {
      const role = createMockRole();
      mockQuery.roles.findFirst.mockResolvedValue(role);
      mockQuery.user_roles.findFirst.mockResolvedValue({
        id: 1,
        userId: 1,
        roleId: 1,
      });

      await expect(service.delete(1)).rejects.toThrow(BadRequestException);
    });
  });
});
