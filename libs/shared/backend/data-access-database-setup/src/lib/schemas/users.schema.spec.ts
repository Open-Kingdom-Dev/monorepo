import { users, UsersTableName } from './users.schema';

describe('Users Schema', () => {
  it('should have correct table name', () => {
    expect(UsersTableName).toBe('users');
  });

  it('should have a users table defined', () => {
    expect(users).toBeDefined();
  });
});
