import { randomUUID } from 'crypto';
import type { Request } from 'express';

/** A pending authorization request: the nonce sent to the provider, kept until
 * the callback is validated. */
export interface PendingAuthorization {
  nonce: string;
  createdAt: number;
}

/** How long an unused pending authorization is kept before being swept. */
export const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

/**
 * Minimal, in-memory `state` store for `passport-oauth2`.
 *
 * passport-oauth2 defaults to a `NullStore` when no `store`/`state`/`pkce` option
 * is given: no `state` is added to the authorization URL and the callback is not
 * correlated to any request. `state: true` is not usable here because it selects
 * the session-backed store, which requires `req.session` and this app has no
 * session middleware.
 *
 * Instead this store — passed as the `store` option — generates an opaque
 * single-use `state` handle per authorization request, and keeps the request's
 * OIDC `nonce` alongside it so `validate()` can bind the ID token to the request
 * that started the flow.
 *
 * Demo-scope only: state lives in process memory, so a restart or a second
 * backend instance invalidates pending sign-ins. That is intentional for a local
 * twin, not a production session store.
 */
export class InMemoryOAuthStateStore {
  private readonly pending = new Map<string, PendingAuthorization>();

  /**
   * Generate a state handle for an authorization request.
   *
   * Declared with 5 parameters so `passport-oauth2` takes its arity-5 branch and
   * calls this as `store(req, verifier, state, meta, callback)` — the branch that
   * also hands over `state`, which is where the nonce travels (see
   * `GoogleAuthEmulateStrategy.authorizationParams`). The arity is dispatched on
   * `Function.length`, so the parameter count here is load-bearing.
   */
  store(
    _req: Request,
    _verifier: string | undefined,
    state: { nonce?: string } | undefined,
    _meta: unknown,
    callback: (err: Error | null, handle?: string) => void
  ): void {
    const handle = randomUUID();
    this.pending.set(handle, {
      nonce: state?.nonce ?? '',
      createdAt: Date.now(),
    });
    this.sweep();
    callback(null, handle);
  }

  /**
   * Verify the `state` returned on the callback.
   *
   * Declared with 3 parameters so `passport-oauth2` calls it as
   * `verify(req, providedState, callback)`.
   *
   * Deliberately does not consume the entry: `validate()` runs before
   * `PassportStrategy` resolves and still needs the nonce, so consumption happens
   * in `consume()` once the nonce has been checked. A replayed callback after a
   * completed sign-in therefore fails here, and the TTL sweep clears entries left
   * behind when the token exchange fails first.
   */
  verify(
    _req: Request,
    providedState: string | undefined,
    callback: (err: Error | null, ok: boolean, state?: unknown) => void
  ): void {
    if (!providedState) {
      return callback(null, false, {
        message: 'Missing OAuth state parameter',
      });
    }

    if (!this.pending.has(providedState)) {
      return callback(null, false, {
        message: 'Invalid or expired OAuth state parameter',
      });
    }

    callback(null, true, providedState);
  }

  /** Single-use read of a pending authorization, consumed during validation. */
  consume(handle: string | undefined): PendingAuthorization | undefined {
    if (!handle) return undefined;

    const entry = this.pending.get(handle);
    if (entry) {
      this.pending.delete(handle);
    }
    return entry;
  }

  private sweep(): void {
    const cutoff = Date.now() - OAUTH_STATE_TTL_MS;
    for (const [handle, entry] of this.pending) {
      if (entry.createdAt < cutoff) {
        this.pending.delete(handle);
      }
    }
  }
}
