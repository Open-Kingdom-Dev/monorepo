import { sqliteTable as table } from 'drizzle-orm/sqlite-core';
import * as t from 'drizzle-orm/sqlite-core';

import { users } from '@open-kingdom/shared-backend-data-access-users';
import {
  companies,
  contacts,
} from '@open-kingdom/crm-backend-data-access-contacts';

export const LeadsTableName = 'leads';

export const leads = table(
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
    contactId: t.int('contact_id').references(() => contacts.id),
    companyId: t.int('company_id').references(() => companies.id),
    convertedAt: t.int('converted_at', { mode: 'timestamp' }),
    convertedToContactId: t
      .int('converted_to_contact_id')
      .references(() => contacts.id),
    convertedToCompanyId: t
      .int('converted_to_company_id')
      .references(() => companies.id),
    ownerId: t
      .int('owner_id')
      .notNull()
      .references(() => users.id),
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
    t.index('leads_owner_idx').on(tbl.ownerId),
    t.index('leads_status_idx').on(tbl.status),
  ]
);

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
