import { sqliteTable as table } from 'drizzle-orm/sqlite-core';
import * as t from 'drizzle-orm/sqlite-core';

import { roles } from './roles.schema';
import { permissions } from './permissions.schema';

export const RolePermissionsTableName = 'role_permissions';

export const rolePermissions = table(
  RolePermissionsTableName,
  {
    id: t.int().primaryKey({ autoIncrement: true }),
    roleId: t
      .int('role_id')
      .notNull()
      .references(() => roles.id),
    permissionId: t
      .int('permission_id')
      .notNull()
      .references(() => permissions.id),
  },
  (tbl) => [t.unique().on(tbl.roleId, tbl.permissionId)]
);

export type RolePermission = typeof rolePermissions.$inferSelect;
export type NewRolePermission = typeof rolePermissions.$inferInsert;
