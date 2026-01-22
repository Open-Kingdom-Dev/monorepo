import { sqliteTable as table } from 'drizzle-orm/sqlite-core';
import * as t from 'drizzle-orm/sqlite-core';

import { users } from './users.schema';

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
  status: t
    .text()
    .$type<'pending' | 'accepted' | 'expired'>()
    .default('pending'),
  role: t.text().$type<'guest' | 'user' | 'admin'>().default('user'),
});

export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
