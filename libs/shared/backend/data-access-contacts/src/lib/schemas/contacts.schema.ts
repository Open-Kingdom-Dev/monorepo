import { sqliteTable as table } from 'drizzle-orm/sqlite-core';
import * as t from 'drizzle-orm/sqlite-core';

import { users } from '@open-kingdom/shared-backend-data-access-users';
import { companies } from './companies.schema';

export const ContactsTableName = 'contacts';

export const contacts = table(
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
    companyId: t.int('company_id').references(() => companies.id),
    leadSource: t.text('lead_source'),
    tags: t.text(),
    mailingAddress: t.text('mailing_address'),
    notesSummary: t.text('notes_summary'),
    status: t.text().notNull().default('active'),
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
    t.index('contacts_owner_idx').on(tbl.ownerId),
    t.index('contacts_company_idx').on(tbl.companyId),
    t.index('contacts_email_idx').on(tbl.email),
    t.index('contacts_last_first_idx').on(tbl.lastName, tbl.firstName),
  ]
);

export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;
