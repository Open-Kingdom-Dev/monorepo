import { Test, TestingModule } from '@nestjs/testing';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';

import { DB_TAG } from '@open-kingdom/shared-poly-util-constants';
import { users, User } from './schemas';
import { UsersService } from './users.service';

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
        findMany: jest.fn(),
      },
    };

    mockDb = {
      query: mockQuery,
      insert: jest.fn().mockReturnValue({
        values: jest.fn().mockResolvedValue(undefined),
      }),
      delete: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
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

  describe('findOne', () => {
    it('should find user by email', async () => {
      const mockUser: User = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'hashed-password',
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

  describe('findById', () => {
    it('should find user by id', async () => {
      const mockUser: User = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'hashed-password',
      };

      mockQuery.users.findFirst.mockResolvedValue(mockUser);

      const result = await service.findById(1);

      expect(result).toEqual(mockUser);
      expect(mockQuery.users.findFirst).toHaveBeenCalledWith({
        where: eq(users.id, 1),
      });
    });

    it('should return undefined when user not found', async () => {
      mockQuery.users.findFirst.mockResolvedValue(undefined);

      const result = await service.findById(999);

      expect(result).toBeUndefined();
      expect(mockQuery.users.findFirst).toHaveBeenCalledWith({
        where: eq(users.id, 999),
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
        password: 'existing-hash',
      };

      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'new-password',
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

    it('should hash password when creating user', async () => {
      const userData = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'password',
      };

      const createdUser: User = {
        id: 3,
        ...userData,
        password: 'hashed-password',
      };

      mockQuery.users.findFirst
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(createdUser);

      await service.ensureUser(userData);

      expect(mockDb.insert).toHaveBeenCalledWith(users);
      expect(mockDb.insert(users).values).toHaveBeenCalledWith({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'hashed-password',
      });
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const mockUsers: User[] = [
        {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          password: 'hash1',
        },
        {
          id: 2,
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
          password: 'hash2',
        },
      ];

      mockQuery.users.findMany.mockResolvedValue(mockUsers);

      const result = await service.findAll();

      expect(result).toEqual(mockUsers);
      expect(mockQuery.users.findMany).toHaveBeenCalled();
    });

    it('should return empty array when no users exist', async () => {
      mockQuery.users.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create user with hashed password', async () => {
      const userData = {
        firstName: 'New',
        lastName: 'User',
        email: 'new@example.com',
        password: 'plain-password',
      };

      const createdUser: User = {
        id: 1,
        ...userData,
        password: 'hashed-password',
      };

      mockQuery.users.findFirst.mockResolvedValue(createdUser);

      const result = await service.create(userData);

      expect(mockedBcrypt.hash).toHaveBeenCalledWith('plain-password', 12);
      expect(mockDb.insert).toHaveBeenCalledWith(users);
      expect(result).toEqual(createdUser);
    });
  });

  describe('delete', () => {
    it('should delete user by id', async () => {
      await service.delete(1);

      expect(mockDb.delete).toHaveBeenCalledWith(users);
      expect(mockDb.delete(users).where).toHaveBeenCalledWith(eq(users.id, 1));
    });
  });
});
