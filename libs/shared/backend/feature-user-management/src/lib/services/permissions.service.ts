import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { eq, and } from 'drizzle-orm';

import { DB_TAG } from '@open-kingdom/shared-poly-util-constants';
import {
  permissions,
  PermissionsTableName,
} from '../schemas/permissions.schema';
import {
  rolePermissions,
  RolePermissionsTableName,
} from '../schemas/role-permissions.schema';
import { userRoles, UserRolesTableName } from '../schemas/user-roles.schema';
import type { Permission } from '../schemas/permissions.schema';

type Schema = {
  [PermissionsTableName]: typeof permissions;
  [RolePermissionsTableName]: typeof rolePermissions;
  [UserRolesTableName]: typeof userRoles;
};

@Injectable()
export class PermissionsService {
  constructor(
    @Inject(DB_TAG) private readonly db: BetterSQLite3Database<Schema>
  ) {}

  async findAll(): Promise<Permission[]> {
    return this.db.query.permissions.findMany();
  }

  async findById(id: number): Promise<Permission> {
    const permission = await this.db.query.permissions.findFirst({
      where: eq(permissions.id, id),
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    return permission;
  }

  async findByResourceAction(
    resource: string,
    action: string
  ): Promise<Permission | undefined> {
    return this.db.query.permissions.findFirst({
      where: and(
        eq(permissions.resource, resource),
        eq(permissions.action, action)
      ),
    });
  }

  async findByRole(roleId: number): Promise<Permission[]> {
    return this.db
      .select({
        id: permissions.id,
        resource: permissions.resource,
        action: permissions.action,
        description: permissions.description,
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, roleId));
  }

  async findByUserId(userId: number): Promise<string[]> {
    const rows = await this.db
      .select({
        resource: permissions.resource,
        action: permissions.action,
      })
      .from(userRoles)
      .innerJoin(rolePermissions, eq(userRoles.roleId, rolePermissions.roleId))
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(userRoles.userId, userId));

    const unique = new Set(rows.map((r) => `${r.resource}:${r.action}`));
    return [...unique];
  }

  async create(
    resource: string,
    action: string,
    description?: string | null
  ): Promise<Permission> {
    const existing = await this.findByResourceAction(resource, action);

    if (existing) {
      throw new BadRequestException(
        `Permission '${resource}:${action}' already exists`
      );
    }

    await this.db
      .insert(permissions)
      .values({ resource, action, description: description ?? null });

    const created = await this.findByResourceAction(resource, action);

    if (!created) {
      throw new BadRequestException('Failed to retrieve created permission');
    }

    return created;
  }

  async delete(id: number): Promise<void> {
    await this.findById(id);

    const assigned = await this.db.query.role_permissions.findFirst({
      where: eq(rolePermissions.permissionId, id),
    });

    if (assigned) {
      throw new BadRequestException(
        'Cannot delete a permission that is assigned to roles'
      );
    }

    await this.db.delete(permissions).where(eq(permissions.id, id));
  }

  async setRolePermissions(
    roleId: number,
    permissionIds: number[]
  ): Promise<void> {
    this.db.transaction((tx) => {
      tx.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));

      if (permissionIds.length > 0) {
        tx.insert(rolePermissions).values(
          permissionIds.map((permissionId) => ({ roleId, permissionId }))
        );
      }
    });
  }
}
