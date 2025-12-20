import { sqliteTable as table } from 'drizzle-orm/sqlite-core';
import * as t from 'drizzle-orm/sqlite-core';

export const CustomRolesTableName = 'custom_roles';

export const customRoles = table(
  CustomRolesTableName,
  {
    id: t.int().primaryKey({ autoIncrement: true }),
    name: t.text().notNull().unique(),
    description: t.text(),
    permissions: t.text(),
    createdAt: t.int('created_at').notNull(),
    createdBy: t.int('created_by').notNull(),
  },
  (tbl) => [t.uniqueIndex('custom_role_name_idx').on(tbl.name)]
);

export type CustomRole = typeof customRoles.$inferSelect;
export type NewCustomRole = typeof customRoles.$inferInsert;
