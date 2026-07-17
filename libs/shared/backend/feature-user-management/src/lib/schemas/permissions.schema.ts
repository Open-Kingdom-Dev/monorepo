import * as t from 'drizzle-orm/sqlite-core';

export const PermissionsTableName = 'permissions';

/**
 * Builds the permissions table with the host-supplied table creator (plain or
 * prefixed). Composed into the lib schema by `createUserManagementSchema`
 * in ./index.ts, which also exports the default (unprefixed) singleton.
 */
export function createPermissionsTable(table: t.SQLiteTableFn) {
  return table(
    PermissionsTableName,
    {
      id: t.int().primaryKey({ autoIncrement: true }),
      resource: t.text().notNull(),
      action: t.text().notNull(),
      description: t.text(),
    },
    (tbl) => [t.unique().on(tbl.resource, tbl.action)]
  );
}

export type PermissionsTable = ReturnType<typeof createPermissionsTable>;

export type Permission = PermissionsTable['$inferSelect'];
export type NewPermission = PermissionsTable['$inferInsert'];
