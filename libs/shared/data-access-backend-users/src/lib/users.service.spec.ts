import { Test, TestingModule } from '@nestjs/testing';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';

import { DB_TAG } from '@ynaa/shared-util-constants';
import { UsersService } from './users.service';
import { users, User } from './schema';

// Mock bcrypt
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('UsersService', () => {
  let service: UsersService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockDb: jest.Mocked<BetterSQLite3Database<any>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockQuery: any;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();
    mockedBcrypt.hash.mockResolvedValue('hashed-password' as never);

    // Create mock database
    mockQuery = {
      users: {
        findFirst: jest.fn(),
      },
    };

    mockDb = {
      query: mockQuery,
      insert: jest.fn().mockReturnValue({
        values: jest.fn().mockResolvedValue(undefined),
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: DB_TAG,
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('onModuleInit', () => {
    it('should create admin user on initialization', async () => {
      mockQuery.users.findFirst.mockResolvedValue(undefined);
      mockQuery.users.findFirst.mockResolvedValueOnce(undefined); // First call for existing check
      mockQuery.users.findFirst.mockResolvedValueOnce({
        // Second call for return
        id: 1,
        firstName: 'Admin',
        lastName: 'Admin',
        email: 'admin@admin.com',
        role: 'admin',
        password: 'hashed-password',
        invitee: null,
      });

      await service.onModuleInit();

      expect(mockQuery.users.findFirst).toHaveBeenCalledWith({
        where: eq(users.email, 'admin@admin.com'),
      });
      expect(mockDb.insert).toHaveBeenCalledWith(users);
      expect(mockedBcrypt.hash).toHaveBeenCalledWith('admin', 12);
    });

    it('should not create admin user if already exists', async () => {
      const existingAdmin = {
        id: 1,
        firstName: 'Admin',
        lastName: 'Admin',
        email: 'admin@admin.com',
        role: 'admin',
        password: 'existing-hash',
        invitee: null,
      };
      mockQuery.users.findFirst.mockResolvedValue(existingAdmin);

      await service.onModuleInit();

      expect(mockQuery.users.findFirst).toHaveBeenCalledWith({
        where: eq(users.email, 'admin@admin.com'),
      });
      expect(mockDb.insert).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should find user by email', async () => {
      const mockUser: User = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        role: 'user',
        password: 'hashed-password',
        invitee: null,
      };

      mockQuery.users.findFirst.mockResolvedValue(mockUser);

      const result = await service.findOne('john@example.com');

      expect(result).toEqual(mockUser);
      expect(mockQuery.users.findFirst).toHaveBeenCalledWith({
        where: eq(users.email, 'john@example.com'),
      });
    });

    it('should return undefined when user not found', async () => {
      mockQuery.users.findFirst.mockResolvedValue(undefined);

      const result = await service.findOne('nonexistent@example.com');

      expect(result).toBeUndefined();
      expect(mockQuery.users.findFirst).toHaveBeenCalledWith({
        where: eq(users.email, 'nonexistent@example.com'),
      });
    });
  });

  describe('ensureUser', () => {
    it('should create new user when user does not exist', async () => {
      const userData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        password: 'plain-password',
        role: 'user' as const,
        invitee: null,
      };

      const createdUser: User = {
        id: 2,
        ...userData,
        password: 'hashed-password',
      };

      mockQuery.users.findFirst
        .mockResolvedValueOnce(undefined) // First call - user doesn't exist
        .mockResolvedValueOnce(createdUser); // Second call - return created user

      const result = await service.ensureUser(userData);

      expect(mockQuery.users.findFirst).toHaveBeenCalledWith({
        where: eq(users.email, 'jane@example.com'),
      });
      expect(mockedBcrypt.hash).toHaveBeenCalledWith('plain-password', 12);
      expect(mockDb.insert).toHaveBeenCalledWith(users);
      expect(result).toEqual(createdUser);
    });

    it('should return existing user when user already exists', async () => {
      const existingUser: User = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        role: 'user',
        password: 'existing-hash',
        invitee: null,
      };

      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'new-password',
        role: 'user' as const,
        invitee: null,
      };

      mockQuery.users.findFirst.mockResolvedValue(existingUser);

      const result = await service.ensureUser(userData);

      expect(mockQuery.users.findFirst).toHaveBeenCalledWith({
        where: eq(users.email, 'john@example.com'),
      });
      expect(mockedBcrypt.hash).not.toHaveBeenCalled();
      expect(mockDb.insert).not.toHaveBeenCalled();
      expect(result).toEqual(existingUser);
    });

    it('should default role to admin when not provided', async () => {
      const userData = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'password',
        invitee: null,
      };

      const createdUser: User = {
        id: 3,
        ...userData,
        role: 'admin',
        password: 'hashed-password',
      };

      mockQuery.users.findFirst
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(createdUser);

      // Intentional type mismatch to test
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await service.ensureUser(userData as any);

      expect(mockDb.insert).toHaveBeenCalledWith(users);
      expect(mockDb.insert(users).values).toHaveBeenCalledWith({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'hashed-password',
        role: 'admin',
      });
    });
  });
});
