import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';

import {
  UsersService,
  User,
} from '@open-kingdom/shared-backend-data-access-users';

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

  describe('recognizing returning users', () => {
    it('identifies the user from a valid token payload', async () => {
      const payload = { username: 'test@example.com', id: 1 };
      usersService.findOne.mockResolvedValue(mockUser);

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
      });
    });

    it('rejects unknown users', async () => {
      const payload = { username: 'nonexistent@example.com', id: 999 };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      usersService.findOne.mockResolvedValue(null as any);

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('never exposes the user password', async () => {
      const payload = { username: 'test@example.com', id: 1 };
      usersService.findOne.mockResolvedValue(mockUser);

      const result = await strategy.validate(payload);

      expect(result).not.toHaveProperty('password');
    });
  });
});
