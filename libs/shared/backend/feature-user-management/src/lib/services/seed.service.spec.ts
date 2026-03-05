import { Test, TestingModule } from '@nestjs/testing';

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

describe('SeedService', () => {
  let service: SeedService;
  let mockUsersService: {
    ensureUser: jest.Mock;
  };
  let mockRolesService: {
    findByName: jest.Mock;
    create: jest.Mock;
  };
  let mockPermissionsService: {
    findByResourceAction: jest.Mock;
    create: jest.Mock;
    setRolePermissions: jest.Mock;
  };
  let mockUserRolesService: {
    assignRole: jest.Mock;
  };

  beforeEach(async () => {
    mockUsersService = {
      ensureUser: jest
        .fn()
        .mockResolvedValue({ id: 1, email: 'admin@admin.com' }),
    };

    mockRolesService = {
      findByName: jest.fn().mockResolvedValue(undefined),
      create: jest
        .fn()
        .mockImplementation(
          (name: string, _desc: string, priority: number) => ({
            id: Math.floor(Math.random() * 100),
            name,
            priority,
          })
        ),
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeedService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: RolesService, useValue: mockRolesService },
        { provide: PermissionsService, useValue: mockPermissionsService },
        { provide: UserRolesService, useValue: mockUserRolesService },
      ],
    }).compile();

    service = module.get<SeedService>(SeedService);
  });

  describe('seeding on startup', () => {
    it('seeds all default roles when none exist', async () => {
      mockRolesService.findByName.mockResolvedValue(undefined);

      await service.onModuleInit();

      expect(mockRolesService.create).toHaveBeenCalledTimes(
        DEFAULT_ROLES.length
      );
    });

    it('skips roles that already exist', async () => {
      mockRolesService.findByName.mockResolvedValue({
        id: 1,
        name: 'existing',
      });

      await service.onModuleInit();

      expect(mockRolesService.create).not.toHaveBeenCalled();
    });

    it('seeds all default permissions when none exist', async () => {
      mockPermissionsService.findByResourceAction.mockResolvedValue(undefined);

      await service.onModuleInit();

      expect(mockPermissionsService.create).toHaveBeenCalledTimes(
        DEFAULT_PERMISSIONS.length
      );
    });

    it('skips permissions that already exist', async () => {
      mockPermissionsService.findByResourceAction.mockResolvedValue({
        id: 1,
        resource: 'existing',
        action: 'read',
      });

      await service.onModuleInit();

      expect(mockPermissionsService.create).not.toHaveBeenCalled();
    });

    it('maps permissions to roles', async () => {
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

    it('seeds the admin user and assigns the admin role', async () => {
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

    it('skips role assignment when the admin role does not exist', async () => {
      mockUsersService.ensureUser.mockResolvedValue({ id: 1 });
      mockRolesService.findByName.mockResolvedValue(undefined);

      await service.onModuleInit();

      expect(mockUserRolesService.assignRole).not.toHaveBeenCalled();
    });
  });
});
