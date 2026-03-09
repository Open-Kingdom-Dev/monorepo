import { sqliteTable as table } from 'drizzle-orm/sqlite-core';
import * as t from 'drizzle-orm/sqlite-core';

export const RolesTableName = 'roles';

export const roles = table(RolesTableName, {
  id: t.int().primaryKey({ autoIncrement: true }),
  name: t.text().notNull().unique(),
  description: t.text(),
  priority: t.int().notNull().default(0),
  isSystem: t.int('is_system').notNull().default(0),
  createdAt: t
    .int('created_at')
    .notNull()
    .$defaultFn(() => Date.now()),
});

export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
