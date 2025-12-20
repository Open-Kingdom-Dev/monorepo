import { Test, TestingModule } from '@nestjs/testing';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';

import { DB_TAG } from '@open-kingdom/shared-poly-util-constants';
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSelect: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockDelete: any;

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

    mockSelect = jest.fn().mockReturnValue({
      from: jest.fn().mockResolvedValue([]),
    });

    mockDelete = jest.fn().mockReturnValue({
      where: jest.fn().mockResolvedValue(undefined),
    });

    mockDb = {
      query: mockQuery,
      insert: jest.fn().mockReturnValue({
        values: jest.fn().mockResolvedValue(undefined),
      }),
      select: mockSelect,
      delete: mockDelete,
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

  describe('findById', () => {
    it('should find user by id', async () => {
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

  describe('findAll', () => {
    it('should return all users', async () => {
      const mockUsers: User[] = [
        {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          role: 'user',
          password: 'hashed-password',
          invitee: null,
        },
        {
          id: 2,
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          role: 'admin',
          password: 'hashed-password',
          invitee: null,
        },
      ];

      mockSelect.mockReturnValue({
        from: jest.fn().mockResolvedValue(mockUsers),
      });

      const result = await service.findAll();

      expect(result).toEqual(mockUsers);
      expect(mockSelect).toHaveBeenCalled();
      expect(mockSelect().from).toHaveBeenCalledWith(users);
    });

    it('should return empty array when no users exist', async () => {
      mockSelect.mockReturnValue({
        from: jest.fn().mockResolvedValue([]),
      });

      const result = await service.findAll();

      expect(result).toEqual([]);
      expect(mockSelect).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete user by id', async () => {
      mockDelete.mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      });

      await service.delete(1);

      expect(mockDelete).toHaveBeenCalledWith(users);
      expect(mockDelete(users).where).toHaveBeenCalledWith(eq(users.id, 1));
    });

    it('should not throw when deleting non-existent user', async () => {
      mockDelete.mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      });

      await expect(service.delete(999)).resolves.not.toThrow();
      expect(mockDelete).toHaveBeenCalledWith(users);
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
