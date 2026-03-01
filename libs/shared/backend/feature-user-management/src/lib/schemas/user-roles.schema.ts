import { sqliteTable as table } from 'drizzle-orm/sqlite-core';
import * as t from 'drizzle-orm/sqlite-core';

import { users } from '@open-kingdom/shared-backend-data-access-users';
import { roles } from './roles.schema';

export const UserRolesTableName = 'user_roles';

export const userRoles = table(UserRolesTableName, {
  id: t.int().primaryKey({ autoIncrement: true }),
  userId: t
    .int('user_id')
    .notNull()
    .references(() => users.id),
  roleId: t
    .int('role_id')
    .notNull()
    .references(() => roles.id),
  assignedAt: t.int('assigned_at').notNull(),
  assignedBy: t.int('assigned_by').references(() => users.id),
});

export type UserRole = typeof userRoles.$inferSelect;
export type NewUserRole = typeof userRoles.$inferInsert;
