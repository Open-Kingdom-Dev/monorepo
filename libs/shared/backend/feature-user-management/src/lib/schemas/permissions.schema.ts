import { sqliteTable as table } from 'drizzle-orm/sqlite-core';
import * as t from 'drizzle-orm/sqlite-core';

export const PermissionsTableName = 'permissions';

export const permissions = table(
  PermissionsTableName,
  {
    id: t.int().primaryKey({ autoIncrement: true }),
    resource: t.text().notNull(),
    action: t.text().notNull(),
    description: t.text(),
  },
  (tbl) => [t.unique().on(tbl.resource, tbl.action)]
);

export type Permission = typeof permissions.$inferSelect;
export type NewPermission = typeof permissions.$inferInsert;
