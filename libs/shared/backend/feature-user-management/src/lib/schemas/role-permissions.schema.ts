import * as t from 'drizzle-orm/sqlite-core';

import type { RolesTable } from './roles.schema';
import type { PermissionsTable } from './permissions.schema';

export const RolePermissionsTableName = 'role_permissions';

/**
 * Builds the role–permission mapping table with the host-supplied table
 * creator (plain or prefixed). Foreign keys target the dep tables supplied by
 * the composing factory so a prefixed instance points at the same-prefix
 * roles/permissions tables. Composed into the lib schema by
 * `createUserManagementSchema` in ./index.ts, which also exports the default
 * (unprefixed) singleton.
 */
export function createRolePermissionsTable(
  table: t.SQLiteTableFn,
  deps: { roles: RolesTable; permissions: PermissionsTable }
) {
  return table(
    RolePermissionsTableName,
    {
      id: t.int().primaryKey({ autoIncrement: true }),
      roleId: t
        .int('role_id')
        .notNull()
        .references(() => deps.roles.id),
      permissionId: t
        .int('permission_id')
        .notNull()
        .references(() => deps.permissions.id),
    },
    (tbl) => [t.unique().on(tbl.roleId, tbl.permissionId)]
  );
}

export type RolePermissionsTable = ReturnType<
  typeof createRolePermissionsTable
>;

export type RolePermission = RolePermissionsTable['$inferSelect'];
export type NewRolePermission = RolePermissionsTable['$inferInsert'];
