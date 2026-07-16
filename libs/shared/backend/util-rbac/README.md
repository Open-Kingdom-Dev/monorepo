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

### External identity (embedded hosts)

The identity contract every OpenKingdom controller relies on is just
`req.user: { id: number; email?: string }` (`AuthenticatedUser` / `AuthenticatedRequest`,
exported here). Hosts with their own auth perimeter register NO OpenKingdom guards and stamp
that shape from their own middleware:

```typescript
app.use((req, res, next) => {
  req.user = { id: localUserId, email }; // verified by the host's own auth
  next();
});
```

`@RequirePermission` decorators are inert without `PermissionGuard`. A host that wants the
guard's RBAC enforcement keeps it and binds `ROLE_RESOLVER` to its own `RoleResolver`
implementation instead of `UserRolesService`.

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
