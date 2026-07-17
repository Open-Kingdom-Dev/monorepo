import { Injectable, Inject } from '@nestjs/common';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { eq, and, getTableColumns } from 'drizzle-orm';

import { DB_TAG, SCHEMA_TAG } from '@open-kingdom/shared-poly-util-constants';
import type { RoleResolver } from '@open-kingdom/shared-backend-util-rbac';
import { PermissionsService } from './permissions.service';
import type { UserManagementSchema } from '../schemas';
import type { Role } from '../schemas/roles.schema';
import type { UserRole } from '../schemas/user-roles.schema';

export interface UserRoleWithRole extends UserRole {
  role: Role;
}

@Injectable()
export class UserRolesService implements RoleResolver {
  // Tables come from the host-composed schema (SCHEMA_TAG) rather than the
  // module-scope singletons, so a prefixed schema (embedded mode) works
  // transparently.
  private readonly userRoles: UserManagementSchema['userRoles'];
  private readonly roles: UserManagementSchema['roles'];

  constructor(
    @Inject(DB_TAG)
    private readonly db: BetterSQLite3Database<UserManagementSchema>,
    @Inject(SCHEMA_TAG) schema: UserManagementSchema,
    private readonly permissionsService: PermissionsService
  ) {
    this.userRoles = schema.userRoles;
    this.roles = schema.roles;
  }

  async findByUserId(userId: number): Promise<UserRoleWithRole[]> {
    const rows = await this.db
      .select({
        ...getTableColumns(this.userRoles),
        role: getTableColumns(this.roles),
      })
      .from(this.userRoles)
      .innerJoin(this.roles, eq(this.userRoles.roleId, this.roles.id))
      .where(eq(this.userRoles.userId, userId));

    return rows;
  }

  async findPrimaryRole(userId: number): Promise<string | null> {
    const [row] = await this.db
      .select({ name: this.roles.name })
      .from(this.userRoles)
      .innerJoin(this.roles, eq(this.userRoles.roleId, this.roles.id))
      .where(eq(this.userRoles.userId, userId))
      .limit(1);

    return row?.name ?? null;
  }

  async findPermissions(userId: number): Promise<string[]> {
    return this.permissionsService.findByUserId(userId);
  }

  async assignRole(
    userId: number,
    roleId: number,
    assignedBy?: number | null
  ): Promise<void> {
    const existing = await this.db.query.userRoles.findFirst({
      where: and(
        eq(this.userRoles.userId, userId),
        eq(this.userRoles.roleId, roleId)
      ),
    });

    if (existing) return;

    await this.db.insert(this.userRoles).values({
      userId,
      roleId,
      assignedAt: Date.now(),
      assignedBy: assignedBy ?? null,
    });
  }

  async removeRole(userId: number, roleId: number): Promise<void> {
    await this.db
      .delete(this.userRoles)
      .where(
        and(
          eq(this.userRoles.userId, userId),
          eq(this.userRoles.roleId, roleId)
        )
      );
  }

  async setRoles(
    userId: number,
    roleIds: number[],
    assignedBy?: number | null
  ): Promise<void> {
    this.db.transaction((tx) => {
      tx.delete(this.userRoles).where(eq(this.userRoles.userId, userId)).run();

      if (roleIds.length > 0) {
        tx.insert(this.userRoles)
          .values(
            roleIds.map((roleId) => ({
              userId,
              roleId,
              assignedAt: Date.now(),
              assignedBy: assignedBy ?? null,
            }))
          )
          .run();
      }
    });
  }
}
