import { sqliteTable, sqliteTableCreator } from 'drizzle-orm/sqlite-core';

import {
  users,
  type UsersSchema,
} from '@open-kingdom/shared-backend-data-access-users';
import {
  companies,
  contacts,
  type ContactsSchema,
} from '@open-kingdom/crm-backend-data-access-contacts';

import { createLeadsTable } from './leads.schema';
import { createOpportunitiesTable } from './opportunities.schema';

export * from './leads.schema';
export * from './opportunities.schema';

/**
 * Builds the opportunities-lib tables, optionally namespaced. With a prefix,
 * the SQL tables become `${prefix}leads` / `${prefix}opportunities` (indexes
 * are prefixed too) while the JS schema keys and column types are unchanged —
 * embedded hosts use this to mount several instances (or coexist with their
 * own tables) in one database. Cross-lib FK targets (users, companies,
 * contacts) are passed in as `deps` so a prefixed instance references the
 * same-prefix dependency tables. The default export below is this factory
 * applied with no prefix and the dependency singletons.
 */
export function createOpportunitiesSchema(
  deps: {
    users: UsersSchema['users'];
    companies: ContactsSchema['companies'];
    contacts: ContactsSchema['contacts'];
  },
  prefix = ''
) {
  const table = prefix
    ? sqliteTableCreator((name) => `${prefix}${name}`)
    : sqliteTable;

  const leads = createLeadsTable(table, deps, prefix);
  const opportunities = createOpportunitiesTable(table, deps, prefix);

  return { leads, opportunities };
}

export type OpportunitiesSchema = ReturnType<typeof createOpportunitiesSchema>;

export const { leads, opportunities } = createOpportunitiesSchema({
  users,
  companies,
  contacts,
});
