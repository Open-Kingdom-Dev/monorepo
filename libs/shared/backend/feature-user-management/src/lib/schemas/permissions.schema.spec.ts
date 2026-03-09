import { permissions, PermissionsTableName } from './permissions.schema';
import { getTableColumns } from 'drizzle-orm';

describe('Permissions', () => {
  const columns = getTableColumns(permissions);

  it('persists to the permissions table', () => {
    expect(PermissionsTableName).toBe('permissions');
  });

  it('requires a resource to identify what it protects', () => {
    expect(columns.resource.notNull).toBe(true);
  });

  it('requires an action to specify what it controls', () => {
    expect(columns.action.notNull).toBe(true);
  });

  it('a description is helpful but not required', () => {
    expect(columns.description.notNull).toBe(false);
  });
});
