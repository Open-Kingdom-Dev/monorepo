import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import {
  UsersService,
  User,
} from '@open-kingdom/shared-backend-data-access-users';

import { AuthenticationService } from './authentication.service';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthenticationService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

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

    const mockJwtService = {
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthenticationService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthenticationService>(AuthenticationService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validating credentials', () => {
    it('authenticates a user with valid credentials', async () => {
      usersService.findOne.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      const result = await service.validateUser(mockUser.email, 'password');

      const { password: _, ...userWithoutPassword } = mockUser;
      expect(result).toEqual(userWithoutPassword);
    });

    it('rejects invalid passwords', async () => {
      usersService.findOne.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(
        service.validateUser(mockUser.email, 'wrong-password')
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects unknown users', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      usersService.findOne.mockResolvedValue(null as any);

      await expect(
        service.validateUser('unknown@example.com', 'password')
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('signing in', () => {
    it('creates a session token with the user identity', async () => {
      const { password: _, ...userWithoutPassword } = mockUser;
      const expectedToken = 'jwt-token';

      jwtService.sign.mockReturnValue(expectedToken);

      const result = await service.login(userWithoutPassword);

      expect(result).toEqual({ access_token: expectedToken });
      expect(jwtService.sign).toHaveBeenCalledWith({
        username: mockUser.email,
        id: mockUser.id,
      });
    });
  });
});
