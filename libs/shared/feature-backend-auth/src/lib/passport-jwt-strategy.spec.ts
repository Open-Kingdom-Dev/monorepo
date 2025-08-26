import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';

import { UsersService, User } from '@ynaa/shared-data-access-backend-users';

import { JwtStrategy, JWT_CONSTANTS } from './passport-jwt-strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let usersService: jest.Mocked<UsersService>;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    password: 'hashed-password',
    firstName: 'John',
    lastName: 'Doe',
    invitee: 1,
    role: 'user',
  };

  beforeEach(async () => {
    const mockUsersService = {
      findOne: jest.fn(),
    };

    const mockJwtConstants = {
      secret: 'test-secret-key',
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JWT_CONSTANTS, useValue: mockJwtConstants },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    usersService = module.get(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should be instantiated with JWT constants', () => {
      expect(strategy).toBeDefined();
      expect(strategy).toBeInstanceOf(JwtStrategy);
    });
  });

  describe('validate', () => {
    it('should validate JWT payload and return user without password', async () => {
      // Arrange
      const payload = { username: 'test@example.com', id: 1 };
      usersService.findOne.mockResolvedValue(mockUser);

      // Act
      const result = await strategy.validate(payload);

      // Assert
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        invitee: mockUser.invitee,
        role: mockUser.role,
      });
      expect(usersService.findOne).toHaveBeenCalledWith(payload.username);
    });

    it('should throw UnauthorizedException for non-existing user', async () => {
      // Arrange
      const payload = { username: 'nonexistent@example.com', id: 999 };
      // Intentionally type mismatch to test the error
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      usersService.findOne.mockResolvedValue(null as any);

      // Act & Assert
      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException
      );

      expect(usersService.findOne).toHaveBeenCalledWith(payload.username);
    });

    it('should handle different user payloads', async () => {
      // Arrange
      const differentUser: User = {
        id: 2,
        email: 'another@example.com',
        password: 'different-hashed-password',
        firstName: 'Jane',
        lastName: 'Doe',
        invitee: 2,
        role: 'user',
      };

      const payload = { username: 'another@example.com', id: 2 };
      usersService.findOne.mockResolvedValue(differentUser);

      // Act
      const result = await strategy.validate(payload);

      // Assert
      expect(result).toEqual({
        id: differentUser.id,
        email: differentUser.email,
        firstName: differentUser.firstName,
        lastName: differentUser.lastName,
        invitee: differentUser.invitee,
        role: differentUser.role,
      });
      expect(usersService.findOne).toHaveBeenCalledWith(payload.username);
    });

    it('should exclude password from returned user object', async () => {
      // Arrange
      const payload = { username: 'test@example.com', id: 1 };
      usersService.findOne.mockResolvedValue(mockUser);

      // Act
      const result = await strategy.validate(payload);

      // Assert
      expect(result).not.toHaveProperty('password');
      expect(result).toHaveProperty('id', mockUser.id);
      expect(result).toHaveProperty('email', mockUser.email);
    });

    it('should handle payload with different id than user id', async () => {
      // Arrange
      const payload = { username: 'test@example.com', id: 999 }; // Different ID
      usersService.findOne.mockResolvedValue(mockUser);

      // Act
      const result = await strategy.validate(payload);

      // Assert
      expect(result).toEqual({
        id: mockUser.id, // Should return actual user ID, not payload ID
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        invitee: mockUser.invitee,
        role: mockUser.role,
      });
      expect(usersService.findOne).toHaveBeenCalledWith(payload.username);
    });
  });
});
