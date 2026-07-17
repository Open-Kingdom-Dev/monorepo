import type { SQLiteTableFn } from 'drizzle-orm/sqlite-core';
import * as t from 'drizzle-orm/sqlite-core';

import type { UsersSchema } from '@open-kingdom/shared-backend-data-access-users';

export const CompaniesTableName = 'companies';

/**
 * Builds the companies table with the given table creator (plain or
 * prefixing). Explicit index names are prefixed by hand — the creator only
 * rewrites table names. Cross-lib FK targets (users) come in via `deps` so a
 * prefixed instance references the same-prefix dependency tables.
 */
export function createCompaniesTable(
  table: SQLiteTableFn,
  deps: { users: UsersSchema['users'] },
  prefix = ''
) {
  return table(
    CompaniesTableName,
    {
      id: t.int().primaryKey({ autoIncrement: true }),
      name: t.text().notNull(),
      website: t.text(),
      primaryPhone: t.text('primary_phone'),
      industry: t.text(),
      status: t.text().notNull().default('active'),
      location: t.text(),
      companySize: t.text('company_size'),
      revenueRange: t.text('revenue_range'),
      notesSummary: t.text('notes_summary'),
      ownerId: t
        .int('owner_id')
        .notNull()
        .references(() => deps.users.id),
      isArchived: t.int('is_archived').notNull().default(0),
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
      t.index(`${prefix}companies_owner_idx`).on(tbl.ownerId),
      t.index(`${prefix}companies_name_idx`).on(tbl.name),
      t.index(`${prefix}companies_status_idx`).on(tbl.status),
    ]
  );
}

type CompaniesTable = ReturnType<typeof createCompaniesTable>;

export type Company = CompaniesTable['$inferSelect'];
export type NewCompany = CompaniesTable['$inferInsert'];
