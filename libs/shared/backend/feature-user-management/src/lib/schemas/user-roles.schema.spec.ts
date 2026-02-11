import {
  userRoles,
  UserRolesTableName,
  UserRole,
  NewUserRole,
} from './user-roles.schema';
import { getTableColumns } from 'drizzle-orm';

describe('UserRoles Schema', () => {
  const columns = getTableColumns(userRoles);

  it('assigns guest role by default', () => {
    expect(columns.role.default).toBe('guest');
  });

  it('uses user_roles as the table name', () => {
    expect(UserRolesTableName).toBe('user_roles');
  });

  describe('type safety', () => {
    it('provides types for existing role records', () => {
      const existingRole: UserRole = {
        id: 1,
        userId: 1,
        role: 'admin',
        assignedAt: Date.now(),
        assignedBy: 1,
      };

      expect(existingRole.id).toBe(1);
    });

    it('provides types for creating new role records', () => {
      const newRole: NewUserRole = {
        userId: 1,
        role: 'user',
        assignedAt: Date.now(),
      };

      expect(newRole.userId).toBe(1);
    });
  });
});
