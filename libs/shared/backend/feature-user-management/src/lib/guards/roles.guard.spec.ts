import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard.js';
import { ROLES_KEY } from '../decorators/roles.decorator.js';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  const createMockContext = (user?: { role?: string }): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    guard = new RolesGuard(reflector);
  });

  describe('when no roles are required', () => {
    it('allows access to public endpoints', () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);
      const context = createMockContext();

      expect(guard.canActivate(context)).toBe(true);
    });

    it('allows access even without authentication', () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);
      const context = createMockContext(undefined);

      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe('when specific roles are required', () => {
    beforeEach(() => {
      reflector.getAllAndOverride.mockReturnValue(['admin']);
    });

    it('grants access to users with the required role', () => {
      const context = createMockContext({ role: 'admin' });

      expect(guard.canActivate(context)).toBe(true);
    });

    it('denies access to users without the required role', () => {
      const context = createMockContext({ role: 'user' });

      expect(guard.canActivate(context)).toBe(false);
    });

    it('denies access when no user is present', () => {
      const context = createMockContext(undefined);

      expect(guard.canActivate(context)).toBe(false);
    });

    it('denies access when user has no role assigned', () => {
      const context = createMockContext({ role: undefined });

      expect(guard.canActivate(context)).toBe(false);
    });
  });

  describe('when multiple roles are allowed', () => {
    beforeEach(() => {
      reflector.getAllAndOverride.mockReturnValue(['admin', 'manager']);
    });

    it('grants access if user has any of the allowed roles', () => {
      const adminContext = createMockContext({ role: 'admin' });
      const managerContext = createMockContext({ role: 'manager' });

      expect(guard.canActivate(adminContext)).toBe(true);
      expect(guard.canActivate(managerContext)).toBe(true);
    });

    it('denies access when user role is not in the allowed list', () => {
      const context = createMockContext({ role: 'guest' });

      expect(guard.canActivate(context)).toBe(false);
    });
  });

  describe('metadata retrieval', () => {
    it('checks both handler and class level decorators', () => {
      reflector.getAllAndOverride.mockReturnValue(['admin']);
      const context = createMockContext({ role: 'admin' });

      guard.canActivate(context);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        expect.any(Function),
        expect.any(Function),
      ]);
    });
  });
});
