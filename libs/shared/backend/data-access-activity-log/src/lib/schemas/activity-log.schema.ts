import { sqliteTable as table } from 'drizzle-orm/sqlite-core';
import * as t from 'drizzle-orm/sqlite-core';

import { users } from '@open-kingdom/shared-backend-data-access-users';

export const ActivityLogTableName = 'activity_log';

export const activityLog = table(
  ActivityLogTableName,
  {
    id: t.int().primaryKey({ autoIncrement: true }),
    relatedType: t.text('related_type').notNull(),
    relatedId: t.int('related_id').notNull(),
    type: t.text().notNull(),
    subject: t.text().notNull(),
    description: t.text(),
    dueAt: t.int('due_at', { mode: 'timestamp' }),
    completedAt: t.int('completed_at', { mode: 'timestamp' }),
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
    t.index('activity_log_related_idx').on(tbl.relatedType, tbl.relatedId),
    t.index('activity_log_owner_idx').on(tbl.ownerId),
    t.index('activity_log_due_idx').on(tbl.dueAt),
  ]
);

export type ActivityLogEntry = typeof activityLog.$inferSelect;
export type NewActivityLogEntry = typeof activityLog.$inferInsert;
