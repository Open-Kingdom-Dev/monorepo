import { Injectable, Inject } from '@nestjs/common';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { eq, and, getTableColumns } from 'drizzle-orm';

import { DB_TAG } from '@open-kingdom/shared-poly-util-constants';
import type { RoleResolver } from '@open-kingdom/shared-backend-util-rbac';
import { userRoles, UserRolesTableName } from '../schemas/user-roles.schema';
import { roles, RolesTableName } from '../schemas/roles.schema';
import { PermissionsService } from './permissions.service';
import type { Role } from '../schemas/roles.schema';
import type { UserRole } from '../schemas/user-roles.schema';

type Schema = {
  [UserRolesTableName]: typeof userRoles;
  [RolesTableName]: typeof roles;
};

export interface UserRoleWithRole extends UserRole {
  role: Role;
}

@Injectable()
export class UserRolesService implements RoleResolver {
  constructor(
    @Inject(DB_TAG) private readonly db: BetterSQLite3Database<Schema>,
    private readonly permissionsService: PermissionsService
  ) {}

  async findByUserId(userId: number): Promise<UserRoleWithRole[]> {
    const rows = await this.db
      .select({
        ...getTableColumns(userRoles),
        role: getTableColumns(roles),
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId));

    return rows;
  }

  async findPrimaryRole(userId: number): Promise<string | null> {
    const [row] = await this.db
      .select({ name: roles.name })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId))
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
    const existing = await this.db.query.user_roles.findFirst({
      where: and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)),
    });

    if (existing) return;

    await this.db.insert(userRoles).values({
      userId,
      roleId,
      assignedAt: Date.now(),
      assignedBy: assignedBy ?? null,
    });
  }

  async removeRole(userId: number, roleId: number): Promise<void> {
    await this.db
      .delete(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)));
  }

  async setRoles(
    userId: number,
    roleIds: number[],
    assignedBy?: number | null
  ): Promise<void> {
    this.db.transaction((tx) => {
      tx.delete(userRoles).where(eq(userRoles.userId, userId));

      if (roleIds.length > 0) {
        tx.insert(userRoles).values(
          roleIds.map((roleId) => ({
            userId,
            roleId,
            assignedAt: Date.now(),
            assignedBy: assignedBy ?? null,
          }))
        );
      }
    });
  }
}
