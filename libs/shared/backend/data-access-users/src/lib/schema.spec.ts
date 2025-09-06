import { users, UserTableName } from './schema';

describe('User Schema', () => {
  describe('table definition', () => {
    it('should have correct table name', () => {
      expect(UserTableName).toBe('users');
    });

    it('should have a users table', () => {
      expect(users).toBeDefined();
    });
  });
});
