import { rolePermissions, RolePermissionsTableName } from './index';
import { getTableColumns } from 'drizzle-orm';

describe('Role–Permission mappings', () => {
  const columns = getTableColumns(rolePermissions);

  it('persists to the role_permissions table', () => {
    expect(RolePermissionsTableName).toBe('role_permissions');
  });

  it('links each mapping to a role', () => {
    expect(columns.roleId.notNull).toBe(true);
  });

  it('links each mapping to a permission', () => {
    expect(columns.permissionId.notNull).toBe(true);
  });
});
