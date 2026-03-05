import { Test, TestingModule } from '@nestjs/testing';

import { DB_TAG } from '@open-kingdom/shared-poly-util-constants';
import { UserRolesService } from './user-roles.service';
import { PermissionsService } from './permissions.service';

interface MockQuery {
  user_roles: {
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

const createSelectChain = (result: unknown[] = []) => {
  // Thenable so await resolves directly; also supports .orderBy().limit() chaining
  const whereResult = {
    orderBy: jest.fn().mockReturnValue({
      limit: jest.fn().mockResolvedValue(result),
    }),
    then: (resolve: (v: unknown) => void) =>
      Promise.resolve(result).then(resolve),
  };

  return {
    from: jest.fn().mockReturnValue({
      innerJoin: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue(whereResult),
      }),
      where: jest.fn().mockResolvedValue(result),
    }),
  };
};

describe('UserRolesService', () => {
  let service: UserRolesService;
  let mockDb: MockDb;
  let mockQuery: MockQuery;
  let mockPermissionsService: { findByUserId: jest.Mock };

  beforeEach(async () => {
    mockQuery = {
      user_roles: {
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

    mockPermissionsService = {
      findByUserId: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRolesService,
        { provide: DB_TAG, useValue: mockDb },
        { provide: PermissionsService, useValue: mockPermissionsService },
      ],
    }).compile();

    service = module.get<UserRolesService>(UserRolesService);
  });

  describe('querying user roles', () => {
    it('returns roles with details for a user', async () => {
      const rows = [
        {
          id: 1,
          userId: 1,
          roleId: 2,
          assignedAt: Date.now(),
          assignedBy: null,
          role: {
            id: 2,
            name: 'user',
            description: 'Standard user',
            priority: 10,
            isSystem: 1,
            createdAt: Date.now(),
          },
        },
      ];
      mockDb.select.mockReturnValue(createSelectChain(rows));

      const result = await service.findByUserId(1);

      expect(result).toEqual(rows);
    });

    it('returns the highest-priority role name', async () => {
      const rows = [{ name: 'admin' }];
      mockDb.select.mockReturnValue(createSelectChain(rows));

      const result = await service.findPrimaryRole(1);

      expect(result).toBe('admin');
    });

    it('returns nothing when the user has no roles', async () => {
      mockDb.select.mockReturnValue(createSelectChain([]));

      const result = await service.findPrimaryRole(1);

      expect(result).toBeNull();
    });
  });

  describe('resolving permissions', () => {
    it('returns the permissions granted to a user', async () => {
      const perms = ['users:read', 'roles:read'];
      mockPermissionsService.findByUserId.mockResolvedValue(perms);

      const result = await service.findPermissions(1);

      expect(result).toEqual(perms);
    });
  });

  describe('assigning roles', () => {
    it('assigns a role to a user', async () => {
      mockQuery.user_roles.findFirst.mockResolvedValue(undefined);

      await service.assignRole(1, 2);

      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('skips assignment when the user already has the role', async () => {
      mockQuery.user_roles.findFirst.mockResolvedValue({
        id: 1,
        userId: 1,
        roleId: 2,
      });

      await service.assignRole(1, 2);

      expect(mockDb.insert).not.toHaveBeenCalled();
    });
  });

  describe('removing roles', () => {
    it('removes a role from a user', async () => {
      await service.removeRole(1, 2);

      expect(mockDb.delete).toHaveBeenCalled();
    });
  });

  describe('replacing all roles', () => {
    it('replaces all roles at once', async () => {
      await service.setRoles(1, [2, 3]);

      expect(mockDb.transaction).toHaveBeenCalled();
    });
  });
});
