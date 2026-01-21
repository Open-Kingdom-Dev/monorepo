// Schema exports
export * from './users.schema.js';
export * from './invitations.schema.js';

// Aggregated schema for Drizzle configuration
import { users, UsersTableName } from './users.schema.js';
import { invitations, InvitationsTableName } from './invitations.schema.js';

export const schema = {
  [UsersTableName]: users,
  [InvitationsTableName]: invitations,
};
