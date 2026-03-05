import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { UsersService } from '@open-kingdom/shared-backend-data-access-users';
import { RolesService } from './roles.service';
import { PermissionsService } from './permissions.service';
import { UserRolesService } from './user-roles.service';
import {
  DEFAULT_ROLES,
  DEFAULT_PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
  SYSTEM_ROLES,
} from '../constants/rbac-defaults';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly rolesService: RolesService,
    private readonly permissionsService: PermissionsService,
    private readonly userRolesService: UserRolesService
  ) {}

  async onModuleInit() {
    await this.seedRoles();
    await this.seedPermissions();
    await this.seedRolePermissions();
    await this.seedAdminUser();
  }

  private async seedRoles(): Promise<void> {
    for (const role of DEFAULT_ROLES) {
      const existing = await this.rolesService.findByName(role.name);

      if (existing) continue;

      await this.rolesService.create(
        role.name,
        role.description,
        role.isSystem
      );
      this.logger.log(`Seeded role: ${role.name}`);
    }
  }

  private async seedPermissions(): Promise<void> {
    for (const perm of DEFAULT_PERMISSIONS) {
      const existing = await this.permissionsService.findByResourceAction(
        perm.resource,
        perm.action
      );

      if (existing) continue;

      await this.permissionsService.create(
        perm.resource,
        perm.action,
        perm.description
      );
      this.logger.log(`Seeded permission: ${perm.resource}:${perm.action}`);
    }
  }

  private async seedRolePermissions(): Promise<void> {
    for (const [roleName, perms] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
      const role = await this.rolesService.findByName(roleName);

      if (!role) {
        this.logger.warn(
          `Role '${roleName}' not found, skipping permission mapping`
        );
        continue;
      }

      const permissionIds: number[] = [];

      for (const perm of perms) {
        const permission = await this.permissionsService.findByResourceAction(
          perm.resource,
          perm.action
        );

        if (permission) {
          permissionIds.push(permission.id);
        } else {
          this.logger.warn(
            `Permission '${perm.resource}:${perm.action}' not found, skipping`
          );
        }
      }

      if (permissionIds.length > 0) {
        await this.permissionsService.setRolePermissions(
          role.id,
          permissionIds
        );
        this.logger.log(
          `Mapped ${permissionIds.length} permissions to role: ${roleName}`
        );
      }
    }
  }

  private async seedAdminUser(): Promise<void> {
    const admin = await this.usersService.ensureUser({
      firstName: 'Admin',
      lastName: 'Admin',
      email: 'admin@admin.com',
      password: 'admin',
    });

    if (!admin) return;

    const adminRole = await this.rolesService.findByName(SYSTEM_ROLES.ADMIN);

    if (!adminRole) {
      this.logger.warn('Admin role not found, skipping admin role assignment');
      return;
    }

    await this.userRolesService.assignRole(admin.id, adminRole.id);
  }
}
