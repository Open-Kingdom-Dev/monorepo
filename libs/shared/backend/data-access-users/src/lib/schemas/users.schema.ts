import { sqliteTable, sqliteTableCreator } from 'drizzle-orm/sqlite-core';
import * as t from 'drizzle-orm/sqlite-core';

export const UsersTableName = 'users';

/**
 * Builds the users table, optionally namespaced. With a prefix, the SQL table
 * becomes `${prefix}users` (indexes are prefixed too) while the JS schema key
 * and column types are unchanged — embedded hosts use this to mount several
 * instances (or coexist with their own tables) in one database. The default
 * export below is this factory applied with no prefix.
 */
export function createUsersSchema(prefix = '') {
  const table = prefix
    ? sqliteTableCreator((name) => `${prefix}${name}`)
    : sqliteTable;

  const users = table(UsersTableName, {
    id: t.int().primaryKey({ autoIncrement: true }),
    firstName: t.text('first_name'),
    lastName: t.text('last_name'),
    email: t.text().notNull().unique(),
    // Nullable: users provisioned by an external identity provider (embedded
    // mode) have no local credential. A null password can never authenticate
    // through the credential path (AuthenticationService guards it).
    password: t.text(),
  });

  return { users };
}

export type UsersSchema = ReturnType<typeof createUsersSchema>;

export const { users } = createUsersSchema();

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
