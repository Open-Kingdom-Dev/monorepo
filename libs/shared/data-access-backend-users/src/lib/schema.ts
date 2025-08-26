import { sqliteTable as table } from 'drizzle-orm/sqlite-core';
import * as t from 'drizzle-orm/sqlite-core';
import { AnySQLiteColumn } from 'drizzle-orm/sqlite-core';

export const UserTableName = 'users';
export const users = table(
  UserTableName,
  {
    id: t.int().primaryKey({ autoIncrement: true }),
    firstName: t.text('first_name'),
    lastName: t.text('last_name'),
    email: t.text().notNull().unique(),
    invitee: t.int().references((): AnySQLiteColumn => users.id),
    role: t.text().$type<'guest' | 'user' | 'admin'>().default('guest'),
    password: t.text().notNull(),
  },
  (table) => [t.uniqueIndex('email_idx').on(table.email)]
);
export type User = typeof users.$inferSelect;
