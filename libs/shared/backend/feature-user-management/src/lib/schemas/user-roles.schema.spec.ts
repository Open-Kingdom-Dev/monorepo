import { userRoles, UserRolesTableName } from './index';
import { getTableColumns } from 'drizzle-orm';

describe('User role assignments', () => {
  const columns = getTableColumns(userRoles);

  it('persists to the user_roles table', () => {
    expect(UserRolesTableName).toBe('user_roles');
  });

  it('links each assignment to a role', () => {
    expect(columns.roleId).toBeDefined();
    expect(columns.roleId.notNull).toBe(true);
  });
});
