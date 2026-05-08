import { Test, TestingModule } from '@nestjs/testing';

import { ConfigurableLookupsService } from '@open-kingdom/shared-backend-data-access-configurable-lookups';
import {
  PermissionsService,
  RolesService,
} from '@open-kingdom/shared-backend-feature-user-management';

import { CrmSeedService } from './crm-seed.service';
import { CRM_FEATURE_OPTIONS } from '../crm-feature.options';

describe('CrmSeedService', () => {
  let service: CrmSeedService;
  let lookups: jest.Mocked<ConfigurableLookupsService>;
  let permissions: jest.Mocked<PermissionsService>;
  let roles: jest.Mocked<RolesService>;

  const buildModule = async (options: unknown = {}) => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrmSeedService,
        { provide: ConfigurableLookupsService, useValue: lookups },
        { provide: PermissionsService, useValue: permissions },
        { provide: RolesService, useValue: roles },
        { provide: CRM_FEATURE_OPTIONS, useValue: options },
      ],
    }).compile();
    return module.get(CrmSeedService);
  };

  beforeEach(() => {
    lookups = {
      seedDefaults: jest.fn(),
    } as unknown as jest.Mocked<ConfigurableLookupsService>;
    permissions = {
      findByRole: jest.fn().mockResolvedValue([]),
      findByResourceAction: jest.fn(),
      create: jest.fn(),
      setRolePermissions: jest.fn(),
    } as unknown as jest.Mocked<PermissionsService>;
    roles = {
      findByName: jest.fn(),
    } as unknown as jest.Mocked<RolesService>;
  });

  it('seeds lookups and maps CRM permissions to known roles', async () => {
    service = await buildModule();
    roles.findByName.mockImplementation(async (name) =>
      ['admin', 'user', 'manager'].includes(name)
        ? ({ id: name === 'admin' ? 1 : name === 'user' ? 2 : 3 } as never)
        : undefined
    );
    permissions.findByResourceAction.mockResolvedValue(undefined);
    permissions.create.mockImplementation(
      async () => ({ id: Math.floor(Math.random() * 10000) } as never)
    );

    await service.onModuleInit();

    expect(lookups.seedDefaults).toHaveBeenCalled();
    expect(permissions.setRolePermissions).toHaveBeenCalled();
  });

  it('skips everything when seedDefaults is false', async () => {
    service = await buildModule({ seedDefaults: false });
    await service.onModuleInit();
    expect(lookups.seedDefaults).not.toHaveBeenCalled();
    expect(permissions.setRolePermissions).not.toHaveBeenCalled();
  });

  it('warns and skips role mapping when role is missing', async () => {
    service = await buildModule();
    roles.findByName.mockResolvedValue(undefined);
    await service.onModuleInit();
    expect(permissions.setRolePermissions).not.toHaveBeenCalled();
  });

  it('reuses existing permissions when they already exist', async () => {
    service = await buildModule();
    roles.findByName.mockResolvedValue({ id: 1 } as never);
    permissions.findByResourceAction.mockResolvedValue({ id: 99 } as never);

    await service.onModuleInit();

    expect(permissions.create).not.toHaveBeenCalled();
    expect(permissions.setRolePermissions).toHaveBeenCalled();
  });

  it('runs with default options when none are provided', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrmSeedService,
        { provide: ConfigurableLookupsService, useValue: lookups },
        { provide: PermissionsService, useValue: permissions },
        { provide: RolesService, useValue: roles },
      ],
    }).compile();
    service = module.get(CrmSeedService);
    roles.findByName.mockResolvedValue(undefined);
    await service.onModuleInit();
    expect(lookups.seedDefaults).toHaveBeenCalled();
  });

  it('does not call setRolePermissions when no new permissions were added', async () => {
    service = await buildModule();
    roles.findByName.mockResolvedValue({ id: 1 } as never);
    // Every CRM permission already exists in the role's current set
    permissions.findByRole.mockImplementation(async () => {
      const existing: Array<{ id: number }> = [];
      for (let i = 1; i <= 30; i++) existing.push({ id: i });
      return existing as never;
    });
    permissions.findByResourceAction.mockImplementation(
      async () => ({ id: 1 } as never)
    );

    await service.onModuleInit();
    expect(permissions.setRolePermissions).not.toHaveBeenCalled();
  });
});
