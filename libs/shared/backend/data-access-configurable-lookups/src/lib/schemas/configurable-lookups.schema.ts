import { sqliteTable as table } from 'drizzle-orm/sqlite-core';
import * as t from 'drizzle-orm/sqlite-core';

export const ConfigurableLookupsTableName = 'configurable_lookups';

export const configurableLookups = table(
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
  (tbl) => [t.uniqueIndex('configurable_lookups_list_value_uq').on(tbl.listKey, tbl.value)]
);

export type ConfigurableLookup = typeof configurableLookups.$inferSelect;
export type NewConfigurableLookup = typeof configurableLookups.$inferInsert;
