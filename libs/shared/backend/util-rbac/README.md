# @open-kingdom/shared-backend-util-rbac

Decorators, guards, and tokens for role-based access control in NestJS.

## Setup

Register both guards globally in `AppModule`. `JwtAuthGuard` must run first to populate `req.user`.

```typescript
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '@open-kingdom/shared-backend-feature-authentication';
import { PermissionGuard, ROLE_RESOLVER } from '@open-kingdom/shared-backend-util-rbac';
import { UserRolesService } from '@open-kingdom/shared-backend-feature-user-management';

providers: [
  { provide: APP_GUARD, useClass: JwtAuthGuard },
  { provide: APP_GUARD, useClass: PermissionGuard },
  { provide: ROLE_RESOLVER, useExisting: UserRolesService },
];
```

## Usage

```typescript
import { Public, RequirePermission } from '@open-kingdom/shared-backend-util-rbac';

@Controller('users')
export class UsersController {
  @Public()
  @Post('login')
  login() { ... }

  @RequirePermission('users', 'read')
  @Get()
  findAll() { ... }
}
```

`@Public()` bypasses both JWT auth and permission checks. It takes precedence over `@RequirePermission()`.

Permissions are checked against the database on every request via `ROLE_RESOLVER.findPermissions(userId)` — not from the JWT.
