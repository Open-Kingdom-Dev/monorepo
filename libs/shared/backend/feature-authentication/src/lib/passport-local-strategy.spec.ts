import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';

import { User } from '@ynaa/shared-backend-data-access-users';

import { LocalStrategy } from './passport-local-strategy';
import { AuthenticationService } from './authentication.service';

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;
  let authService: jest.Mocked<AuthenticationService>;

  const mockUser: Omit<User, 'password'> = {
    id: 1,
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    invitee: 1,
    role: 'user',
  };

  beforeEach(async () => {
    const mockAuthService = {
      validateUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        { provide: AuthenticationService, useValue: mockAuthService },
      ],
    }).compile();

    strategy = module.get<LocalStrategy>(LocalStrategy);
    authService = module.get(AuthenticationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should validate user with correct credentials', async () => {
      // Arrange
      const username = 'test@example.com';
      const password = 'valid-password';

      authService.validateUser.mockResolvedValue(mockUser);

      // Act
      const result = await strategy.validate(username, password);

      // Assert
      expect(result).toEqual(mockUser);
      expect(authService.validateUser).toHaveBeenCalledWith(username, password);
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      // Arrange
      const username = 'test@example.com';
      const password = 'invalid-password';

      // Intentionally type mismatch to test the error
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      authService.validateUser.mockResolvedValue(null as any);

      // Act & Assert
      await expect(strategy.validate(username, password)).rejects.toThrow(
        UnauthorizedException
      );

      expect(authService.validateUser).toHaveBeenCalledWith(username, password);
    });

    it('should throw UnauthorizedException when auth service throws', async () => {
      // Arrange
      const username = 'test@example.com';
      const password = 'invalid-password';

      authService.validateUser.mockRejectedValue(
        new UnauthorizedException('Invalid credentials')
      );

      // Act & Assert
      await expect(strategy.validate(username, password)).rejects.toThrow(
        UnauthorizedException
      );

      expect(authService.validateUser).toHaveBeenCalledWith(username, password);
    });
  });
});
