import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { eq, and, getTableColumns } from 'drizzle-orm';

import { DB_TAG, SCHEMA_TAG } from '@open-kingdom/shared-poly-util-constants';
import type { UserManagementSchema } from '../schemas';
import type { Permission } from '../schemas/permissions.schema';

@Injectable()
export class PermissionsService {
  // Tables come from the host-composed schema (SCHEMA_TAG) rather than the
  // module-scope singletons, so a prefixed schema (embedded mode) works
  // transparently.
  private readonly permissions: UserManagementSchema['permissions'];
  private readonly rolePermissions: UserManagementSchema['rolePermissions'];
  private readonly userRoles: UserManagementSchema['userRoles'];

  constructor(
    @Inject(DB_TAG)
    private readonly db: BetterSQLite3Database<UserManagementSchema>,
    @Inject(SCHEMA_TAG) schema: UserManagementSchema
  ) {
    this.permissions = schema.permissions;
    this.rolePermissions = schema.rolePermissions;
    this.userRoles = schema.userRoles;
  }

  async findAll(): Promise<Permission[]> {
    return this.db.query.permissions.findMany();
  }

  async findById(id: number): Promise<Permission> {
    const permission = await this.db.query.permissions.findFirst({
      where: eq(this.permissions.id, id),
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
        eq(this.permissions.resource, resource),
        eq(this.permissions.action, action)
      ),
    });
  }

  async findByRole(roleId: number): Promise<Permission[]> {
    return this.db
      .select(getTableColumns(this.permissions))
      .from(this.rolePermissions)
      .innerJoin(this.permissions, eq(this.rolePermissions.permissionId, this.permissions.id))
      .where(eq(this.rolePermissions.roleId, roleId));
  }

  async findByUserId(userId: number): Promise<string[]> {
    const rows = await this.db
      .select({
        resource: this.permissions.resource,
        action: this.permissions.action,
      })
      .from(this.userRoles)
      .innerJoin(this.rolePermissions, eq(this.userRoles.roleId, this.rolePermissions.roleId))
      .innerJoin(this.permissions, eq(this.rolePermissions.permissionId, this.permissions.id))
      .where(eq(this.userRoles.userId, userId));

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
      .insert(this.permissions)
      .values({ resource, action, description: description ?? null });

    const created = await this.findByResourceAction(resource, action);

    if (!created) {
      throw new BadRequestException('Failed to retrieve created permission');
    }

    return created;
  }

  async delete(id: number): Promise<void> {
    await this.findById(id);

    const assigned = await this.db.query.rolePermissions.findFirst({
      where: eq(this.rolePermissions.permissionId, id),
    });

    if (assigned) {
      throw new BadRequestException(
        'Cannot delete a permission that is assigned to roles'
      );
    }

    await this.db.delete(this.permissions).where(eq(this.permissions.id, id));
  }

  async setRolePermissions(
    roleId: number,
    permissionIds: number[]
  ): Promise<void> {
    this.db.transaction((tx) => {
      tx.delete(this.rolePermissions)
        .where(eq(this.rolePermissions.roleId, roleId))
        .run();

      if (permissionIds.length > 0) {
        tx.insert(this.rolePermissions)
          .values(
            permissionIds.map((permissionId) => ({ roleId, permissionId }))
          )
          .run();
      }
    });
  }
}
