import { sqliteTable as table } from 'drizzle-orm/sqlite-core';
import * as t from 'drizzle-orm/sqlite-core';

export const UsersTableName = 'users';

export const users = table(UsersTableName, {
  id: t.int().primaryKey({ autoIncrement: true }),
  firstName: t.text('first_name'),
  lastName: t.text('last_name'),
  email: t.text().notNull().unique(),
  // Nullable: users provisioned by an external identity provider (embedded
  // mode) have no local credential. A null password can never authenticate
  // through the credential path (AuthenticationService guards it).
  password: t.text(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
