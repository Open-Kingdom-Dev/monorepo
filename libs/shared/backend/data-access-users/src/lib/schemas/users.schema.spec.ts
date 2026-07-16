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

    it('allows a null password for externally-provisioned identities', () => {
      // Embedded hosts bring their own auth: their users have no local
      // credential. A null password can never pass the credential path
      // (AuthenticationService rejects it before comparing).
      expect(columns.password).toBeDefined();
      expect(columns.password.notNull).toBe(false);
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
