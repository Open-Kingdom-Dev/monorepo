import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';

import {
  UsersService,
  User,
} from '@open-kingdom/shared-backend-data-access-users';

import { ROLE_RESOLVER } from '@open-kingdom/shared-backend-util-rbac';

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

    const mockRoleResolver = {
      findPrimaryRole: jest.fn().mockResolvedValue('admin'),
      findPermissions: jest.fn().mockResolvedValue(['users:read']),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JWT_CONSTANTS, useValue: mockJwtConstants },
        { provide: ROLE_RESOLVER, useValue: mockRoleResolver },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    usersService = module.get(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('recognizing returning users', () => {
    it('identifies the user along with their role and permissions', async () => {
      const payload = { username: 'test@example.com', id: 1 };
      usersService.findOne.mockResolvedValue(mockUser);

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        role: 'admin',
        permissions: ['users:read'],
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

    it('provides basic access when role information is not configured', async () => {
      const moduleWithoutResolver = await Test.createTestingModule({
        providers: [
          JwtStrategy,
          {
            provide: UsersService,
            useValue: { findOne: jest.fn().mockResolvedValue(mockUser) },
          },
          { provide: JWT_CONSTANTS, useValue: { secret: 'test-secret-key' } },
        ],
      }).compile();

      const strategyWithoutResolver =
        moduleWithoutResolver.get<JwtStrategy>(JwtStrategy);
      const payload = { username: 'test@example.com', id: 1 };

      const result = await strategyWithoutResolver.validate(payload);

      expect(result.role).toBeNull();
      expect(result.permissions).toEqual([]);
    });
  });
});
