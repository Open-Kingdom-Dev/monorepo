import type { SQLiteTableFn } from 'drizzle-orm/sqlite-core';
import * as t from 'drizzle-orm/sqlite-core';

import type { UsersSchema } from '@open-kingdom/shared-backend-data-access-users';
import type { ContactsSchema } from '@open-kingdom/crm-backend-data-access-contacts';

export const LeadsTableName = 'leads';

/**
 * Builds the leads table with the given table creator (plain or prefixing).
 * Explicit index names are prefixed by hand — the creator only rewrites
 * table names. Cross-lib FK targets (users, companies, contacts) come in via
 * `deps` so a prefixed instance references the same-prefix dependency tables.
 */
export function createLeadsTable(
  table: SQLiteTableFn,
  deps: {
    users: UsersSchema['users'];
    companies: ContactsSchema['companies'];
    contacts: ContactsSchema['contacts'];
  },
  prefix = ''
) {
  return table(
    LeadsTableName,
    {
      id: t.int().primaryKey({ autoIncrement: true }),
      name: t.text().notNull(),
      companyName: t.text('company_name'),
      email: t.text(),
      phone: t.text(),
      source: t.text(),
      status: t.text().notNull().default('new'),
      notes: t.text(),
      contactId: t.int('contact_id').references(() => deps.contacts.id),
      companyId: t.int('company_id').references(() => deps.companies.id),
      convertedAt: t.int('converted_at', { mode: 'timestamp' }),
      convertedToContactId: t
        .int('converted_to_contact_id')
        .references(() => deps.contacts.id),
      convertedToCompanyId: t
        .int('converted_to_company_id')
        .references(() => deps.companies.id),
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
      t.index(`${prefix}leads_owner_idx`).on(tbl.ownerId),
      t.index(`${prefix}leads_status_idx`).on(tbl.status),
    ]
  );
}

type LeadsTable = ReturnType<typeof createLeadsTable>;

export type Lead = LeadsTable['$inferSelect'];
export type NewLead = LeadsTable['$inferInsert'];
