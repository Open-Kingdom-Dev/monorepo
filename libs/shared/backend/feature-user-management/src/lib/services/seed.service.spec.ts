import { Test, TestingModule } from '@nestjs/testing';
import { DiscoveryService, Reflector } from '@nestjs/core';

import { UsersService } from '@open-kingdom/shared-backend-data-access-users';
import { SeedService } from './seed.service';
import { RolesService } from './roles.service';
import { PermissionsService } from './permissions.service';
import { UserRolesService } from './user-roles.service';
import {
  DEFAULT_ROLES,
  DEFAULT_PERMISSIONS,
  SYSTEM_ROLES,
} from '../constants/rbac-defaults';

describe('preparing the system on first launch', () => {
  let service: SeedService;
  let mockUsersService: { ensureUser: jest.Mock };
  let mockRolesService: { findByName: jest.Mock; create: jest.Mock };
  let mockPermissionsService: {
    findByResourceAction: jest.Mock;
    create: jest.Mock;
    setRolePermissions: jest.Mock;
  };
  let mockUserRolesService: { assignRole: jest.Mock };
  let mockDiscoveryService: { getControllers: jest.Mock };
  let mockReflector: { get: jest.Mock };

  beforeEach(async () => {
    mockUsersService = {
      ensureUser: jest
        .fn()
        .mockResolvedValue({ id: 1, email: 'admin@admin.com' }),
    };

    mockRolesService = {
      findByName: jest.fn().mockResolvedValue(undefined),
      create: jest.fn().mockImplementation((name: string) => ({
        id: Math.floor(Math.random() * 100),
        name,
      })),
    };

    mockPermissionsService = {
      findByResourceAction: jest.fn().mockResolvedValue(undefined),
      create: jest
        .fn()
        .mockImplementation((resource: string, action: string) => ({
          id: Math.floor(Math.random() * 100),
          resource,
          action,
        })),
      setRolePermissions: jest.fn().mockResolvedValue(undefined),
    };

    mockUserRolesService = {
      assignRole: jest.fn().mockResolvedValue(undefined),
    };

    mockDiscoveryService = {
      getControllers: jest.fn().mockReturnValue([]),
    };

    mockReflector = {
      get: jest.fn().mockReturnValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeedService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: RolesService, useValue: mockRolesService },
        { provide: PermissionsService, useValue: mockPermissionsService },
        { provide: UserRolesService, useValue: mockUserRolesService },
        { provide: DiscoveryService, useValue: mockDiscoveryService },
        { provide: Reflector, useValue: mockReflector },
      ],
    }).compile();

    service = module.get<SeedService>(SeedService);
  });

  describe('setting up roles', () => {
    it('creates all built-in roles on a fresh system', async () => {
      mockRolesService.findByName.mockResolvedValue(undefined);

      await service.onModuleInit();

      expect(mockRolesService.create).toHaveBeenCalledTimes(
        DEFAULT_ROLES.length
      );
    });

    it('leaves existing roles untouched', async () => {
      mockRolesService.findByName.mockResolvedValue({
        id: 1,
        name: 'existing',
      });

      await service.onModuleInit();

      expect(mockRolesService.create).not.toHaveBeenCalled();
    });
  });

  describe('setting up permissions', () => {
    it('creates all built-in permissions on a fresh system', async () => {
      mockPermissionsService.findByResourceAction.mockResolvedValue(undefined);

      await service.onModuleInit();

      expect(mockPermissionsService.create).toHaveBeenCalledTimes(
        DEFAULT_PERMISSIONS.length
      );
    });

    it('leaves existing permissions untouched', async () => {
      mockPermissionsService.findByResourceAction.mockResolvedValue({
        id: 1,
        resource: 'existing',
        action: 'read',
      });

      await service.onModuleInit();

      expect(mockPermissionsService.create).not.toHaveBeenCalled();
    });
  });

  describe('connecting permissions to roles', () => {
    it('grants each role the permissions it should have', async () => {
      const adminRole = { id: 1, name: SYSTEM_ROLES.ADMIN };
      const userRole = { id: 2, name: SYSTEM_ROLES.USER };

      mockRolesService.findByName.mockImplementation(async (name: string) => {
        if (name === SYSTEM_ROLES.ADMIN) return adminRole;
        if (name === SYSTEM_ROLES.USER) return userRole;
        return undefined;
      });

      let permId = 1;
      mockPermissionsService.findByResourceAction.mockImplementation(
        async () => ({ id: permId++, resource: 'r', action: 'a' })
      );

      await service.onModuleInit();

      expect(mockPermissionsService.setRolePermissions).toHaveBeenCalled();
    });
  });

  describe('setting up the admin account', () => {
    it('creates the admin user and gives them the admin role', async () => {
      const admin = { id: 1, email: 'admin@admin.com' };
      const adminRole = { id: 3, name: SYSTEM_ROLES.ADMIN };

      mockUsersService.ensureUser.mockResolvedValue(admin);
      mockRolesService.findByName.mockImplementation(async (name: string) => {
        if (name === SYSTEM_ROLES.ADMIN) return adminRole;
        return undefined;
      });

      await service.onModuleInit();

      expect(mockUsersService.ensureUser).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'admin@admin.com' })
      );
      expect(mockUserRolesService.assignRole).toHaveBeenCalledWith(
        admin.id,
        adminRole.id
      );
    });

    it('skips role assignment when the admin role does not exist yet', async () => {
      mockUsersService.ensureUser.mockResolvedValue({ id: 1 });
      mockRolesService.findByName.mockResolvedValue(undefined);

      await service.onModuleInit();

      expect(mockUserRolesService.assignRole).not.toHaveBeenCalled();
    });
  });

  describe('picking up new permissions from the codebase', () => {
    it('registers a permission that exists in code but not in the database', async () => {
      class WidgetsController {
        list() {
          return;
        }
      }
      const instance = new WidgetsController();

      mockDiscoveryService.getControllers.mockReturnValue([{ instance }]);
      mockReflector.get.mockImplementation((_key: string, method: unknown) =>
        method === instance.list ? 'widgets:read' : undefined
      );
      mockPermissionsService.findByResourceAction.mockResolvedValue(undefined);

      await service.onModuleInit();

      expect(mockPermissionsService.create).toHaveBeenCalledWith(
        'widgets',
        'read',
        'Auto-discovered'
      );
    });

    it('does not duplicate a permission that already exists', async () => {
      class WidgetsController {
        list() {
          return;
        }
      }
      const instance = new WidgetsController();

      mockDiscoveryService.getControllers.mockReturnValue([{ instance }]);
      mockReflector.get.mockImplementation((_key: string, method: unknown) =>
        method === instance.list ? 'users:read' : undefined
      );
      mockPermissionsService.findByResourceAction.mockResolvedValue({
        id: 1,
        resource: 'users',
        action: 'read',
      });

      await service.onModuleInit();

      expect(mockPermissionsService.create).not.toHaveBeenCalledWith(
        'users',
        'read',
        'Auto-discovered'
      );
    });
  });
});
