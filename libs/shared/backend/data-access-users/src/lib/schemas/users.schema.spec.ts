import { users, UsersTableName, User, NewUser } from './users.schema';
import { getTableColumns } from 'drizzle-orm';

describe('Users Schema', () => {
  const columns = getTableColumns(users);

  describe('storing user identity', () => {
    it('captures essential profile information', () => {
      expect(columns.firstName).toBeDefined();
      expect(columns.lastName).toBeDefined();
      expect(columns.email).toBeDefined();
    });

    it('requires email for user identification', () => {
      expect(columns.email.notNull).toBe(true);
    });

    it('prevents duplicate email addresses', () => {
      expect(columns.email.isUnique).toBe(true);
    });

    it('requires a password for authentication', () => {
      expect(columns.password.notNull).toBe(true);
    });
  });

  describe('managing user permissions', () => {
    it('assigns guest role by default for new users', () => {
      expect(columns.role.default).toBe('guest');
    });

    it('supports guest, user, and admin roles', () => {
      // Type check ensures only valid roles can be assigned
      const validRoles: User['role'][] = ['guest', 'user', 'admin'];
      expect(validRoles).toHaveLength(3);
    });
  });

  describe('tracking user relationships', () => {
    it('records who invited each user', () => {
      expect(columns.invitedBy).toBeDefined();
    });
  });

  describe('type exports', () => {
    it('exports table name for consistent references', () => {
      expect(UsersTableName).toBe('users');
    });

    it('provides type inference for queries and inserts', () => {
      // Compile-time check - if these types don't work, TypeScript will fail
      const mockUser: User = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'hashed',
        role: 'user',
        invitedBy: null,
      };

      const mockNewUser: NewUser = {
        email: 'jane@example.com',
        password: 'hashed',
      };

      expect(mockUser.email).toBe('john@example.com');
      expect(mockNewUser.email).toBe('jane@example.com');
    });
  });
});
