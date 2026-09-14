import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Passport guard for the `google-emulate` strategy.
 *
 * Extends the default guard only to preserve the failure reason — a missing or
 * invalid `state`, a `nonce` mismatch, or a failed token exchange — so that
 * `GoogleAuthFailureRedirectFilter` can show it on the demo page instead of the
 * generic "Unauthorized".
 */
@Injectable()
export class GoogleAuthEmulateGuard extends AuthGuard('google-emulate') {
  override handleRequest<TUser = unknown>(
    err: unknown,
    user: unknown,
    info: unknown
  ): TUser {
    if (err || !user) {
      const message =
        (info as { message?: string } | null)?.message ??
        (err instanceof Error ? err.message : null) ??
        'Google authentication failed';

      throw new UnauthorizedException(message);
    }

    return user as TUser;
  }
}
