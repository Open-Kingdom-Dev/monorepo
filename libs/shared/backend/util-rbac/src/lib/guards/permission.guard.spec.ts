import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionGuard } from './permission.guard.js';

describe('Permission enforcement', () => {
  let guard: PermissionGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new PermissionGuard(reflector);
  });

  function simulateRequest(user?: {
    permissions?: string[];
  }): ExecutionContext {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  it('unprotected endpoints are open to everyone', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = simulateRequest();
    expect(guard.canActivate(context)).toBe(true);
  });

  it('a user with the right permission can proceed', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('users:read');
    const context = simulateRequest({
      permissions: ['users:read', 'profile:read'],
    });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('a user without the right permission is turned away', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('users:delete');
    const context = simulateRequest({
      permissions: ['users:read', 'profile:read'],
    });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('a user with no permissions at all is turned away', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('users:read');
    const context = simulateRequest({});
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('an unauthenticated visitor is turned away', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('users:read');
    const context = simulateRequest(undefined);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
