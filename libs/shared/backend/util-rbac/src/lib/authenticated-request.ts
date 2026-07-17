/**
 * The canonical identity contract between hosts and OpenKingdom backend
 * packages.
 *
 * Every OpenKingdom controller that needs the caller reads `req.user.id`
 * (record ownership) — nothing more. In the standard stack, `JwtAuthGuard`
 * populates `req.user` and `PermissionGuard` decorates it with
 * `role`/`permissions`. In EMBEDDED mode, the host registers neither guard and
 * instead stamps this shape from its own auth middleware:
 *
 * ```ts
 * app.use((req, res, next) => {
 *   req.user = { id: localUserId, email };  // resolved by the host's perimeter
 *   next();
 * });
 * ```
 *
 * Hosts that keep `PermissionGuard` supply their own `ROLE_RESOLVER` instead.
 */
export interface AuthenticatedUser {
  id: number;
  email?: string;
  role?: string | null;
  permissions?: string[];
}

export interface AuthenticatedRequest {
  user?: AuthenticatedUser;
}
