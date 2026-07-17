import { sqliteTable, sqliteTableCreator } from 'drizzle-orm/sqlite-core';
import * as t from 'drizzle-orm/sqlite-core';

import { users } from '@open-kingdom/shared-backend-data-access-users';
import type { UsersSchema } from '@open-kingdom/shared-backend-data-access-users';

export const ActivityLogTableName = 'activity_log';

/**
 * Builds the activity log table, optionally namespaced. With a prefix, the
 * SQL table becomes `${prefix}activity_log` (indexes are prefixed too) while
 * the JS schema key and column types are unchanged — embedded hosts use this
 * to mount several instances (or coexist with their own tables) in one
 * database. Cross-lib foreign keys are supplied via `deps` so a prefixed
 * instance points at the matching prefixed users table. The default export
 * below is this factory applied with the users singleton and no prefix.
 */
export function createActivityLogSchema(
  deps: { users: UsersSchema['users'] },
  prefix = ''
) {
  const table = prefix
    ? sqliteTableCreator((name) => `${prefix}${name}`)
    : sqliteTable;

  const activityLog = table(
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
      t
        .index(`${prefix}activity_log_related_idx`)
        .on(tbl.relatedType, tbl.relatedId),
      t.index(`${prefix}activity_log_owner_idx`).on(tbl.ownerId),
      t.index(`${prefix}activity_log_due_idx`).on(tbl.dueAt),
    ]
  );

  return { activityLog };
}

export type ActivityLogSchema = ReturnType<typeof createActivityLogSchema>;

export const { activityLog } = createActivityLogSchema({ users });

export type ActivityLogEntry = typeof activityLog.$inferSelect;
export type NewActivityLogEntry = typeof activityLog.$inferInsert;
