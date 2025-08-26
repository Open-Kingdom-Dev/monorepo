import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { UsersService, User } from '@ynaa/shared-data-access-backend-users';

import { AuthenticationService } from './authentication.service';

describe('AuthService', () => {
  let service: AuthenticationService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    password: bcrypt.hashSync('password', 12),
    firstName: 'John',
    lastName: 'Doe',
    invitee: 1,
    role: 'user',
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

  describe('validateUser', () => {
    it('should authenticate user with valid credentials', async () => {
      usersService.findOne.mockResolvedValue(mockUser);

      const result = await service.validateUser(mockUser.email, 'password');
      const { password: _, ...userWithoutPassword } = mockUser;
      expect(result).toEqual(userWithoutPassword);
      expect(usersService.findOne).toHaveBeenCalledWith(mockUser.email);
    });

    it('should reject authentication for invalid credentials', async () => {
      usersService.findOne.mockResolvedValue(mockUser);
      await expect(
        service.validateUser(mockUser.email, 'invalid-password')
      ).rejects.toThrow(UnauthorizedException);
      expect(usersService.findOne).toHaveBeenCalledWith(mockUser.email);
    });

    it('should reject authentication for non-existing user', async () => {
      // Arrange
      const email = 'nonexistent@example.com';
      // Intentionally type mismatch to test the error
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      usersService.findOne.mockResolvedValue(null as any);

      // Act & Assert
      await expect(service.validateUser(email, 'password')).rejects.toThrow(
        UnauthorizedException
      );

      expect(usersService.findOne).toHaveBeenCalledWith(email);
    });
  });

  describe('login', () => {
    it('should generate JWT token for authenticated user', async () => {
      // Arrange
      const { password: _, ...userWithoutPassword } = mockUser;
      const expectedToken = 'jwt-token';

      jwtService.sign.mockReturnValue(expectedToken);

      // Act
      const result = await service.login(userWithoutPassword);

      // Assert
      expect(result).toEqual({ access_token: expectedToken });
      expect(jwtService.sign).toHaveBeenCalledWith({
        username: mockUser.email,
        id: mockUser.id,
      });
    });
  });
});
