import type { SQLiteTableFn } from 'drizzle-orm/sqlite-core';
import * as t from 'drizzle-orm/sqlite-core';

import type { UsersSchema } from '@open-kingdom/shared-backend-data-access-users';
import type { ContactsSchema } from '@open-kingdom/crm-backend-data-access-contacts';

export const OpportunitiesTableName = 'opportunities';

/**
 * Builds the opportunities table with the given table creator (plain or
 * prefixing). Explicit index names are prefixed by hand — the creator only
 * rewrites table names. Cross-lib FK targets (users, companies, contacts)
 * come in via `deps` so a prefixed instance references the same-prefix
 * dependency tables.
 */
export function createOpportunitiesTable(
  table: SQLiteTableFn,
  deps: {
    users: UsersSchema['users'];
    companies: ContactsSchema['companies'];
    contacts: ContactsSchema['contacts'];
  },
  prefix = ''
) {
  return table(
    OpportunitiesTableName,
    {
      id: t.int().primaryKey({ autoIncrement: true }),
      title: t.text().notNull(),
      companyId: t
        .int('company_id')
        .notNull()
        .references(() => deps.companies.id),
      primaryContactId: t
        .int('primary_contact_id')
        .references(() => deps.contacts.id),
      stage: t.text().notNull().default('new'),
      estimatedValue: t.real('estimated_value'),
      probability: t.real(),
      expectedCloseDate: t.int('expected_close_date', { mode: 'timestamp' }),
      closedAt: t.int('closed_at', { mode: 'timestamp' }),
      lossReason: t.text('loss_reason'),
      notes: t.text(),
      ownerId: t
        .int('owner_id')
        .notNull()
        .references(() => deps.users.id),
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
      t.index(`${prefix}opportunities_owner_idx`).on(tbl.ownerId),
      t.index(`${prefix}opportunities_stage_idx`).on(tbl.stage),
      t.index(`${prefix}opportunities_company_idx`).on(tbl.companyId),
      t
        .index(`${prefix}opportunities_close_date_idx`)
        .on(tbl.expectedCloseDate),
    ]
  );
}

type OpportunitiesTable = ReturnType<typeof createOpportunitiesTable>;

export type Opportunity = OpportunitiesTable['$inferSelect'];
export type NewOpportunity = OpportunitiesTable['$inferInsert'];
