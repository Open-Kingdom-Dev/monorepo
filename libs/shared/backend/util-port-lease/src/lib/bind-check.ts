/**
 * The diagnostic bind-check — §5 of docs/Worktree-Port-Leasing.md.
 *
 * The registry already guarantees no other worktree holds this block, so a busy
 * port means a stale or foreign process on the machine. Warn loudly and let the
 * service fail; silently reassigning could steal a block another worktree has
 * legitimately leased.
 */
import { createServer } from 'node:net';

export interface BindCheckOptions {
  /** Interface to test-bind against. Defaults to `127.0.0.1`. */
  host?: string;
  /** Give up on a single port after this long, in ms. Defaults to `500`. */
  timeoutMs?: number;
}

/** Resolves true when nothing is currently listening on `port`. */
export function isPortFree(
  port: number,
  { host = '127.0.0.1', timeoutMs = 500 }: BindCheckOptions = {}
): Promise<boolean> {
  return new Promise((resolvePromise) => {
    const server = createServer();
    let settled = false;

    const settle = (free: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      server.removeAllListeners();
      server.close(() => resolvePromise(free));
    };

    const timer = setTimeout(() => settle(false), timeoutMs);
    if (typeof timer.unref === 'function') timer.unref();

    server.once('error', () => settle(false));
    server.once('listening', () => settle(true));
    server.listen({ port, host, exclusive: true });
  });
}

/**
 * Returns the subset of `ports` that something is already listening on.
 *
 * Intended purely as a startup diagnostic — surface the result, never use it to
 * pick a different port.
 */
export async function findBusyPorts(
  ports: number[],
  options: BindCheckOptions = {}
): Promise<number[]> {
  const results = await Promise.all(
    ports.map(async (port) => ({ port, free: await isPortFree(port, options) }))
  );
  return results.filter((r) => !r.free).map((r) => r.port);
}
