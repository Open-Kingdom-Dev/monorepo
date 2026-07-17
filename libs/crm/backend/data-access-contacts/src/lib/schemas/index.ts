import { sqliteTable, sqliteTableCreator } from 'drizzle-orm/sqlite-core';

import {
  users,
  type UsersSchema,
} from '@open-kingdom/shared-backend-data-access-users';

import { createCompaniesTable } from './companies.schema';
import { createContactsTable } from './contacts.schema';

export * from './companies.schema';
export * from './contacts.schema';

/**
 * Builds the contacts-lib tables, optionally namespaced. With a prefix, the
 * SQL tables become `${prefix}companies` / `${prefix}contacts` (indexes are
 * prefixed too) while the JS schema keys and column types are unchanged —
 * embedded hosts use this to mount several instances (or coexist with their
 * own tables) in one database. Cross-lib FK targets (users) are passed in as
 * `deps` so a prefixed instance references the same-prefix dependency tables.
 * The default export below is this factory applied with no prefix and the
 * users-lib singletons.
 */
export function createContactsSchema(
  deps: { users: UsersSchema['users'] },
  prefix = ''
) {
  const table = prefix
    ? sqliteTableCreator((name) => `${prefix}${name}`)
    : sqliteTable;

  const companies = createCompaniesTable(table, { users: deps.users }, prefix);
  const contacts = createContactsTable(
    table,
    { users: deps.users, companies },
    prefix
  );

  return { companies, contacts };
}

export type ContactsSchema = ReturnType<typeof createContactsSchema>;

export const { companies, contacts } = createContactsSchema({ users });
