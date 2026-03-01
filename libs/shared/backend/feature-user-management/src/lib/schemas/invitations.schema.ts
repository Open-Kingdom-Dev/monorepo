import { sqliteTable as table } from 'drizzle-orm/sqlite-core';
import * as t from 'drizzle-orm/sqlite-core';

import { users } from '@open-kingdom/shared-backend-data-access-users';
import { roles } from './roles.schema';

export const InvitationsTableName = 'invitations';

export const invitations = table(InvitationsTableName, {
  id: t.int().primaryKey({ autoIncrement: true }),
  email: t.text().notNull(),
  token: t.text().notNull().unique(),
  tokenExpiry: t.int('token_expiry').notNull(),
  invitedBy: t
    .int('invited_by')
    .notNull()
    .references(() => users.id),
  invitedAt: t.int('invited_at').notNull(),
  roleId: t
    .int('role_id')
    .notNull()
    .references(() => roles.id),
  status: t
    .text()
    .$type<'pending' | 'accepted' | 'expired'>()
    .default('pending'),
});

export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
