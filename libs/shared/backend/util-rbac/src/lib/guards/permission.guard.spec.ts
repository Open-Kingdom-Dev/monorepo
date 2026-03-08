import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import { REQUIRED_PERMISSION_KEY } from '../decorators/require-permission.decorator.js';
import { PermissionGuard } from './permission.guard.js';

describe('checking permissions', () => {
  let guard: PermissionGuard;
  let reflector: Reflector;
  let mockRoleResolver: {
    findPrimaryRole: jest.Mock;
    findPermissions: jest.Mock;
  };

  beforeEach(() => {
    reflector = new Reflector();
    mockRoleResolver = {
      findPrimaryRole: jest.fn().mockResolvedValue(null),
      findPermissions: jest.fn().mockResolvedValue([]),
    };
    guard = new PermissionGuard(reflector, mockRoleResolver);
    guard.onModuleInit();
  });

  function simulateRequest(user?: { id?: number }): {
    context: ExecutionContext;
    getUser: () => Record<string, unknown>;
  } {
    const requestUser = user ? { ...user } : user;
    return {
      context: {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({
          getRequest: () => ({ user: requestUser }),
        }),
      } as unknown as ExecutionContext,
      getUser: () => requestUser as Record<string, unknown>,
    };
  }

  function markRoute(opts: { isPublic?: boolean; permission?: string }) {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockImplementation((key: unknown) => {
        if (key === IS_PUBLIC_KEY) return opts.isPublic ?? false;
        if (key === REQUIRED_PERMISSION_KEY) return opts.permission;
        return undefined;
      });
  }

  describe('allowing access', () => {
    it('lets anyone reach a public endpoint without signing in', async () => {
      markRoute({ isPublic: true });
      const { context } = simulateRequest();

      await expect(guard.canActivate(context)).resolves.toBe(true);
      expect(mockRoleResolver.findPermissions).not.toHaveBeenCalled();
    });

    it('lets a user through an endpoint that requires no specific permission', async () => {
      markRoute({});
      mockRoleResolver.findPrimaryRole.mockResolvedValue('user');
      mockRoleResolver.findPermissions.mockResolvedValue(['profile:read']);
      const { context } = simulateRequest({ id: 1 });

      await expect(guard.canActivate(context)).resolves.toBe(true);
    });

    it('lets a user through when they hold the required permission', async () => {
      markRoute({ permission: 'users:read' });
      mockRoleResolver.findPermissions.mockResolvedValue([
        'users:read',
        'profile:read',
      ]);
      const { context } = simulateRequest({ id: 1 });

      await expect(guard.canActivate(context)).resolves.toBe(true);
    });
  });

  describe('denying access', () => {
    it('turns away a user who lacks the required permission', async () => {
      markRoute({ permission: 'users:delete' });
      mockRoleResolver.findPermissions.mockResolvedValue([
        'users:read',
        'profile:read',
      ]);
      const { context } = simulateRequest({ id: 1 });

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException
      );
    });

    it('turns away a user who has no permissions at all', async () => {
      markRoute({ permission: 'users:read' });
      mockRoleResolver.findPermissions.mockResolvedValue([]);
      const { context } = simulateRequest({ id: 1 });

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException
      );
    });

    it('turns away a visitor who is not signed in', async () => {
      markRoute({ permission: 'users:read' });
      const { context } = simulateRequest(undefined);

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('enriching the request with role data', () => {
    it('attaches the role and permissions to the request user', async () => {
      markRoute({});
      mockRoleResolver.findPrimaryRole.mockResolvedValue('admin');
      mockRoleResolver.findPermissions.mockResolvedValue([
        'users:read',
        'profile:read',
      ]);
      const { context, getUser } = simulateRequest({ id: 42 });

      await guard.canActivate(context);

      const user = getUser();
      expect(user['role']).toBe('admin');
      expect(user['permissions']).toEqual(['users:read', 'profile:read']);
    });

    it('sets role to null when the user has no role assigned', async () => {
      markRoute({});
      mockRoleResolver.findPrimaryRole.mockResolvedValue(null);
      mockRoleResolver.findPermissions.mockResolvedValue([]);
      const { context, getUser } = simulateRequest({ id: 1 });

      await guard.canActivate(context);

      const user = getUser();
      expect(user['role']).toBeNull();
      expect(user['permissions']).toEqual([]);
    });

    it('skips enrichment for public endpoints', async () => {
      markRoute({ isPublic: true });
      const { context } = simulateRequest();

      await guard.canActivate(context);

      expect(mockRoleResolver.findPrimaryRole).not.toHaveBeenCalled();
      expect(mockRoleResolver.findPermissions).not.toHaveBeenCalled();
    });
  });

  describe('verifying permissions come from the database', () => {
    it('looks up the current permissions for the signed-in user', async () => {
      markRoute({ permission: 'users:read' });
      mockRoleResolver.findPermissions.mockResolvedValue(['users:read']);
      const { context } = simulateRequest({ id: 42 });

      await guard.canActivate(context);

      expect(mockRoleResolver.findPermissions).toHaveBeenCalledWith(42);
      expect(mockRoleResolver.findPrimaryRole).toHaveBeenCalledWith(42);
    });
  });

  describe('starting up', () => {
    it('prevents the application from starting without a way to look up permissions', () => {
      const incomplete = new PermissionGuard(reflector);

      expect(() => incomplete.onModuleInit()).toThrow(
        'PermissionGuard requires ROLE_RESOLVER'
      );
    });
  });
});
