import { sqliteTable, sqliteTableCreator } from 'drizzle-orm/sqlite-core';

import { users } from '@open-kingdom/shared-backend-data-access-users';
import type { UsersSchema } from '@open-kingdom/shared-backend-data-access-users';

import { createRolesTable } from './roles.schema';
import { createPermissionsTable } from './permissions.schema';
import { createRolePermissionsTable } from './role-permissions.schema';
import { createUserRolesTable } from './user-roles.schema';
import { createInvitationsTable } from './invitations.schema';

export * from './roles.schema';
export * from './permissions.schema';
export * from './role-permissions.schema';
export * from './invitations.schema';
export * from './user-roles.schema';

/**
 * Builds the user-management tables, optionally namespaced. With a prefix,
 * every SQL table becomes `${prefix}${name}` while the JS schema keys and
 * column types are unchanged — embedded hosts use this to mount several
 * instances (or coexist with their own tables) in one database. Cross-lib
 * foreign keys are supplied via `deps` so a prefixed instance points at the
 * matching prefixed users table; intra-lib foreign keys are wired to the
 * tables built in the same call. The default export below is this factory
 * applied with the users singleton and no prefix.
 */
export function createUserManagementSchema(
  deps: { users: UsersSchema['users'] },
  prefix = ''
) {
  const table = prefix
    ? sqliteTableCreator((name) => `${prefix}${name}`)
    : sqliteTable;

  const roles = createRolesTable(table);
  const permissions = createPermissionsTable(table);
  const rolePermissions = createRolePermissionsTable(table, {
    roles,
    permissions,
  });
  const userRoles = createUserRolesTable(table, { users: deps.users, roles });
  const invitations = createInvitationsTable(table, {
    users: deps.users,
    roles,
  });

  return { roles, permissions, rolePermissions, invitations, userRoles };
}

export type UserManagementSchema = ReturnType<
  typeof createUserManagementSchema
>;

export const { roles, permissions, rolePermissions, invitations, userRoles } =
  createUserManagementSchema({ users });
