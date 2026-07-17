export {
  RequirePermission,
  REQUIRED_PERMISSION_KEY,
} from './lib/decorators/require-permission.decorator.js';
export { Public, IS_PUBLIC_KEY } from './lib/decorators/public.decorator.js';
export { PermissionGuard } from './lib/guards/permission.guard.js';
export { ROLE_RESOLVER } from './lib/role-resolver.js';
export type { RoleResolver } from './lib/role-resolver.js';
export type {
  AuthenticatedUser,
  AuthenticatedRequest,
} from './lib/authenticated-request.js';
