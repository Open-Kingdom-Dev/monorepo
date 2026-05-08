import { sqliteTable as table } from 'drizzle-orm/sqlite-core';
import * as t from 'drizzle-orm/sqlite-core';

import { users } from '@open-kingdom/shared-backend-data-access-users';
import {
  companies,
  contacts,
} from '@open-kingdom/crm-backend-data-access-contacts';

export const OpportunitiesTableName = 'opportunities';

export const opportunities = table(
  OpportunitiesTableName,
  {
    id: t.int().primaryKey({ autoIncrement: true }),
    title: t.text().notNull(),
    companyId: t
      .int('company_id')
      .notNull()
      .references(() => companies.id),
    primaryContactId: t.int('primary_contact_id').references(() => contacts.id),
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
    t.index('opportunities_owner_idx').on(tbl.ownerId),
    t.index('opportunities_stage_idx').on(tbl.stage),
    t.index('opportunities_company_idx').on(tbl.companyId),
    t.index('opportunities_close_date_idx').on(tbl.expectedCloseDate),
  ]
);

export type Opportunity = typeof opportunities.$inferSelect;
export type NewOpportunity = typeof opportunities.$inferInsert;
