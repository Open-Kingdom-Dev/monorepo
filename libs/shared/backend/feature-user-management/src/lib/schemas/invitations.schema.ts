import * as t from 'drizzle-orm/sqlite-core';

import type { UsersSchema } from '@open-kingdom/shared-backend-data-access-users';
import type { RolesTable } from './roles.schema';

export const InvitationsTableName = 'invitations';

/**
 * Builds the invitations table with the host-supplied table creator (plain or
 * prefixed). Foreign keys target the dep tables supplied by the composing
 * factory so a prefixed instance points at the same-prefix users/roles
 * tables. Composed into the lib schema by `createUserManagementSchema` in
 * ./index.ts, which also exports the default (unprefixed) singleton.
 */
export function createInvitationsTable(
  table: t.SQLiteTableFn,
  deps: { users: UsersSchema['users']; roles: RolesTable }
) {
  return table(InvitationsTableName, {
    id: t.int().primaryKey({ autoIncrement: true }),
    email: t.text().notNull(),
    token: t.text().notNull().unique(),
    tokenExpiry: t.int('token_expiry').notNull(),
    invitedBy: t
      .int('invited_by')
      .notNull()
      .references(() => deps.users.id),
    invitedAt: t.int('invited_at').notNull(),
    roleId: t
      .int('role_id')
      .notNull()
      .references(() => deps.roles.id),
    status: t
      .text()
      .$type<'pending' | 'accepted' | 'expired'>()
      .default('pending'),
  });
}

export type InvitationsTable = ReturnType<typeof createInvitationsTable>;

export type Invitation = InvitationsTable['$inferSelect'];
export type NewInvitation = InvitationsTable['$inferInsert'];
