import { getTableName } from 'drizzle-orm';
import { getTableConfig } from 'drizzle-orm/sqlite-core';

import {
  users,
  createUsersSchema,
} from '@open-kingdom/shared-backend-data-access-users';
import {
  createUserManagementSchema,
  roles,
  permissions,
  rolePermissions,
  invitations,
  userRoles,
} from './index';

describe('User management schema factory', () => {
  it('builds unprefixed tables by default', () => {
    const schema = createUserManagementSchema({ users });
    expect(getTableName(schema.roles)).toBe('roles');
    expect(getTableName(schema.permissions)).toBe('permissions');
    expect(getTableName(schema.rolePermissions)).toBe('role_permissions');
    expect(getTableName(schema.invitations)).toBe('invitations');
    expect(getTableName(schema.userRoles)).toBe('user_roles');
  });

  it('exposes unprefixed singletons for standalone hosts', () => {
    expect(getTableName(roles)).toBe('roles');
    expect(getTableName(permissions)).toBe('permissions');
    expect(getTableName(rolePermissions)).toBe('role_permissions');
    expect(getTableName(invitations)).toBe('invitations');
    expect(getTableName(userRoles)).toBe('user_roles');
  });

  it('prefixes every table name when a prefix is supplied', () => {
    const prefixedUsers = createUsersSchema('pfx_');
    const schema = createUserManagementSchema(
      { users: prefixedUsers.users },
      'pfx_'
    );
    expect(getTableName(schema.roles)).toBe('pfx_roles');
    expect(getTableName(schema.permissions)).toBe('pfx_permissions');
    expect(getTableName(schema.rolePermissions)).toBe('pfx_role_permissions');
    expect(getTableName(schema.invitations)).toBe('pfx_invitations');
    expect(getTableName(schema.userRoles)).toBe('pfx_user_roles');
  });

  it('points a prefixed instance at the same-prefix dependency tables', () => {
    const prefixedUsers = createUsersSchema('pfx_');
    const schema = createUserManagementSchema(
      { users: prefixedUsers.users },
      'pfx_'
    );

    const foreignNames = (table: Parameters<typeof getTableConfig>[0]) =>
      getTableConfig(table).foreignKeys.map((fk) =>
        getTableName(fk.reference().foreignTable)
      );

    // Cross-lib FK: user_roles/invitations → prefixed users, prefixed roles
    expect(foreignNames(schema.userRoles)).toEqual(
      expect.arrayContaining(['pfx_users', 'pfx_roles'])
    );
    expect(foreignNames(schema.invitations)).toEqual(
      expect.arrayContaining(['pfx_users', 'pfx_roles'])
    );

    // Intra-lib FK: role_permissions → prefixed roles and permissions
    expect(foreignNames(schema.rolePermissions)).toEqual(
      expect.arrayContaining(['pfx_roles', 'pfx_permissions'])
    );
  });
});
