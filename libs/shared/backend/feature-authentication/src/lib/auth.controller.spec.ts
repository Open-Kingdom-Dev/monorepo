import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';

import { User } from '@open-kingdom/shared-backend-data-access-users';

import { AuthController } from './auth.controller';
import { AuthenticationService } from './authentication.service';
import { IS_PUBLIC_KEY } from '@open-kingdom/shared-backend-util-rbac';
import type { RequestWithUser } from './auth.types';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthenticationService>;

  const mockUser: Omit<User, 'password'> = {
    id: 1,
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
  };

  beforeEach(async () => {
    const mockAuthService = {
      requestChallenge: jest.fn(),
      login: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthenticationService, useValue: mockAuthService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthenticationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('allows login without requiring a JWT token', () => {
    const metadata = Reflect.getMetadata(
      IS_PUBLIC_KEY,
      AuthController.prototype.login
    );
    expect(metadata).toBe(true);
  });

  describe('login', () => {
    it('should login authenticated user and return access token', async () => {
      // Arrange
      const mockRequest = {
        user: mockUser,
        logout: jest.fn(),
      } as unknown as Request & {
        user: Omit<User, 'password'>;
        logout: () => void;
      };

      const expectedToken = { access_token: 'jwt-token' };
      authService.login.mockResolvedValue(expectedToken);

      const result = await controller.login(
        mockRequest as unknown as RequestWithUser
      );

      // Assert
      expect(result).toEqual(expectedToken);
      expect(authService.login).toHaveBeenCalledWith(mockUser);
    });

    it('should handle login with different user data', async () => {
      // Arrange
      const differentUser: Omit<User, 'password'> = {
        id: 2,
        email: 'another@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
      };

      const mockRequest = {
        user: differentUser,
        logout: jest.fn(),
      } as unknown as Request & {
        user: Omit<User, 'password'>;
        logout: () => void;
      };

      const expectedToken = { access_token: 'different-jwt-token' };
      authService.login.mockResolvedValue(expectedToken);

      const result = await controller.login(
        mockRequest as unknown as RequestWithUser
      );

      // Assert
      expect(result).toEqual(expectedToken);
      expect(authService.login).toHaveBeenCalledWith(differentUser);
    });
  });

  describe('getProfile', () => {
    it('should return user profile for authenticated user', () => {
      // Arrange
      const mockRequest = {
        user: mockUser,
        logout: jest.fn(),
      } as unknown as Request & {
        user: Omit<User, 'password'>;
        logout: () => void;
      };

      const result = controller.getProfile(
        mockRequest as unknown as RequestWithUser
      );

      // Assert
      expect(result).toEqual(mockUser);
    });

    it('should return different user profile for different authenticated user', () => {
      // Arrange
      const differentUser: Omit<User, 'password'> = {
        id: 3,
        email: 'third@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      const mockRequest = {
        user: differentUser,
        logout: jest.fn(),
      } as unknown as Request & {
        user: Omit<User, 'password'>;
        logout: () => void;
      };

      const result = controller.getProfile(
        mockRequest as unknown as RequestWithUser
      );

      // Assert
      expect(result).toEqual(differentUser);
    });
  });
});
