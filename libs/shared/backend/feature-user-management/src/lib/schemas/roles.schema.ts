import * as t from 'drizzle-orm/sqlite-core';

export const RolesTableName = 'roles';

/**
 * Builds the roles table with the host-supplied table creator (plain or
 * prefixed). Composed into the lib schema by `createUserManagementSchema`
 * in ./index.ts, which also exports the default (unprefixed) singleton.
 */
export function createRolesTable(table: t.SQLiteTableFn) {
  return table(RolesTableName, {
    id: t.int().primaryKey({ autoIncrement: true }),
    name: t.text().notNull().unique(),
    description: t.text(),
    isSystem: t.int('is_system').notNull().default(0),
    createdAt: t
      .int('created_at')
      .notNull()
      .$defaultFn(() => Date.now()),
  });
}

export type RolesTable = ReturnType<typeof createRolesTable>;

export type Role = RolesTable['$inferSelect'];
export type NewRole = RolesTable['$inferInsert'];
