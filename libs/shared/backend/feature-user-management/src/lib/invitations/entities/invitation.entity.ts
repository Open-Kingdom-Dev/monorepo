import { sqliteTable as table } from 'drizzle-orm/sqlite-core';
import * as t from 'drizzle-orm/sqlite-core';

export const InvitationsTableName = 'invitations';

export const invitations = table(
  InvitationsTableName,
  {
    id: t.int().primaryKey({ autoIncrement: true }),
    email: t.text().notNull(),
    firstName: t.text('first_name'),
    lastName: t.text('last_name'),
    role: t.text().$type<'guest' | 'user' | 'admin'>().default('user'),
    customRoleId: t.int('custom_role_id'),
    token: t.text().notNull().unique(),
    tokenExpiry: t.int('token_expiry').notNull(),
    invitedBy: t.int('invited_by').notNull(),
    invitedAt: t.int('invited_at').notNull(),
    status: t
      .text()
      .$type<'pending' | 'accepted' | 'expired'>()
      .default('pending'),
  },
  (tbl) => [t.uniqueIndex('invitation_token_idx').on(tbl.token)]
);

export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
