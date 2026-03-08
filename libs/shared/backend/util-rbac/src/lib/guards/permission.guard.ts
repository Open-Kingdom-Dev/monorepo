import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  OnModuleInit,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import { REQUIRED_PERMISSION_KEY } from '../decorators/require-permission.decorator.js';
import { ROLE_RESOLVER } from '../role-resolver.js';
import type { RoleResolver } from '../role-resolver.js';

@Injectable()
export class PermissionGuard implements CanActivate, OnModuleInit {
  private resolvedRoleResolver!: RoleResolver;

  constructor(
    private readonly reflector: Reflector,
    @Optional()
    @Inject(ROLE_RESOLVER)
    private readonly roleResolver?: RoleResolver
  ) {}

  onModuleInit() {
    if (!this.roleResolver) {
      throw new Error(
        'PermissionGuard requires ROLE_RESOLVER to be provided. ' +
          'Register a provider: { provide: ROLE_RESOLVER, useExisting: YourRoleResolverService }'
      );
    }
    this.resolvedRoleResolver = this.roleResolver;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const { user } = context.switchToHttp().getRequest();

    if (!user?.id) {
      throw new UnauthorizedException();
    }

    const [role, permissions] = await Promise.all([
      this.resolvedRoleResolver.findPrimaryRole(user.id),
      this.resolvedRoleResolver.findPermissions(user.id),
    ]);

    user.role = role;
    user.permissions = permissions;

    const requiredPermission = this.reflector.getAllAndOverride<string>(
      REQUIRED_PERMISSION_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (requiredPermission && !permissions.includes(requiredPermission)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
