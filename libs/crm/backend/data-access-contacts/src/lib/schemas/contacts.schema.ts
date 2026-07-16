import type { SQLiteTableFn } from 'drizzle-orm/sqlite-core';
import * as t from 'drizzle-orm/sqlite-core';

import type { UsersSchema } from '@open-kingdom/shared-backend-data-access-users';
import type { createCompaniesTable } from './companies.schema';

export const ContactsTableName = 'contacts';

/**
 * Builds the contacts table with the given table creator (plain or
 * prefixing). Explicit index names are prefixed by hand — the creator only
 * rewrites table names. FK targets (users cross-lib, companies intra-lib)
 * come in via `deps` so a prefixed instance references the same-prefix
 * dependency tables.
 */
export function createContactsTable(
  table: SQLiteTableFn,
  deps: {
    users: UsersSchema['users'];
    companies: ReturnType<typeof createCompaniesTable>;
  },
  prefix = ''
) {
  return table(
    ContactsTableName,
    {
      id: t.int().primaryKey({ autoIncrement: true }),
      firstName: t.text('first_name').notNull(),
      lastName: t.text('last_name').notNull(),
      email: t.text(),
      phone: t.text(),
      secondaryPhone: t.text('secondary_phone'),
      secondaryEmail: t.text('secondary_email'),
      jobTitle: t.text('job_title'),
      companyId: t.int('company_id').references(() => deps.companies.id),
      leadSource: t.text('lead_source'),
      tags: t.text(),
      mailingAddress: t.text('mailing_address'),
      notesSummary: t.text('notes_summary'),
      status: t.text().notNull().default('active'),
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
      t.index(`${prefix}contacts_owner_idx`).on(tbl.ownerId),
      t.index(`${prefix}contacts_company_idx`).on(tbl.companyId),
      t.index(`${prefix}contacts_email_idx`).on(tbl.email),
      t.index(`${prefix}contacts_last_first_idx`).on(tbl.lastName, tbl.firstName),
    ]
  );
}

type ContactsTable = ReturnType<typeof createContactsTable>;

export type Contact = ContactsTable['$inferSelect'];
export type NewContact = ContactsTable['$inferInsert'];
