import { sqliteTable as table } from 'drizzle-orm/sqlite-core';
import * as t from 'drizzle-orm/sqlite-core';

import { users } from '@open-kingdom/shared-backend-data-access-users';

export const CompaniesTableName = 'companies';

export const companies = table(
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
      .references(() => users.id),
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
    t.index('companies_owner_idx').on(tbl.ownerId),
    t.index('companies_name_idx').on(tbl.name),
    t.index('companies_status_idx').on(tbl.status),
  ]
);

export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
