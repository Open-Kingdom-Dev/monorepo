import { sqliteTable, sqliteTableCreator } from 'drizzle-orm/sqlite-core';
import * as t from 'drizzle-orm/sqlite-core';

export const ConfigurableLookupsTableName = 'configurable_lookups';

/**
 * Builds the configurable lookups table, optionally namespaced. With a prefix,
 * the SQL table becomes `${prefix}configurable_lookups` (indexes are prefixed
 * too) while the JS schema key and column types are unchanged — embedded hosts
 * use this to mount several instances (or coexist with their own tables) in
 * one database. The default export below is this factory applied with no
 * prefix.
 */
export function createConfigurableLookupsSchema(prefix = '') {
  const table = prefix
    ? sqliteTableCreator((name) => `${prefix}${name}`)
    : sqliteTable;

  const configurableLookups = table(
    ConfigurableLookupsTableName,
    {
      id: t.int().primaryKey({ autoIncrement: true }),
      listKey: t.text('list_key').notNull(),
      value: t.text().notNull(),
      label: t.text().notNull(),
      sortOrder: t.int('sort_order').notNull().default(0),
      isSystem: t.int('is_system').notNull().default(0),
      isActive: t.int('is_active').notNull().default(1),
      createdAt: t
        .int('created_at', { mode: 'timestamp' })
        .notNull()
        .$defaultFn(() => new Date()),
      updatedAt: t
        .int('updated_at', { mode: 'timestamp' })
        .notNull()
        .$defaultFn(() => new Date()),
    },
    (tbl) => [
      t
        .uniqueIndex(`${prefix}configurable_lookups_list_value_uq`)
        .on(tbl.listKey, tbl.value),
    ]
  );

  return { configurableLookups };
}

export type ConfigurableLookupsSchema = ReturnType<
  typeof createConfigurableLookupsSchema
>;

export const { configurableLookups } = createConfigurableLookupsSchema();

export type ConfigurableLookup = typeof configurableLookups.$inferSelect;
export type NewConfigurableLookup = typeof configurableLookups.$inferInsert;
