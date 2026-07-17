import * as t from 'drizzle-orm/sqlite-core';

import type { UsersSchema } from '@open-kingdom/shared-backend-data-access-users';
import type { RolesTable } from './roles.schema';

export const UserRolesTableName = 'user_roles';

/**
 * Builds the user–role assignment table with the host-supplied table creator
 * (plain or prefixed). Foreign keys target the dep tables supplied by the
 * composing factory so a prefixed instance points at the same-prefix
 * users/roles tables. Composed into the lib schema by
 * `createUserManagementSchema` in ./index.ts, which also exports the default
 * (unprefixed) singleton.
 */
export function createUserRolesTable(
  table: t.SQLiteTableFn,
  deps: { users: UsersSchema['users']; roles: RolesTable }
) {
  return table(UserRolesTableName, {
    id: t.int().primaryKey({ autoIncrement: true }),
    userId: t
      .int('user_id')
      .notNull()
      .references(() => deps.users.id),
    roleId: t
      .int('role_id')
      .notNull()
      .references(() => deps.roles.id),
    assignedAt: t.int('assigned_at').notNull(),
    assignedBy: t.int('assigned_by').references(() => deps.users.id),
  });
}

export type UserRolesTable = ReturnType<typeof createUserRolesTable>;

export type UserRole = UserRolesTable['$inferSelect'];
export type NewUserRole = UserRolesTable['$inferInsert'];
