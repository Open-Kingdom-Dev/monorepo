/**
 * The diagnostic bind-check — §5 of docs/Worktree-Port-Leasing.md.
 *
 * The registry already guarantees no other worktree holds this block, so a busy
 * port means a stale or foreign process on the machine. Warn loudly and let the
 * service fail; silently reassigning could steal a block another worktree has
 * legitimately leased.
 */
import { connect, createServer } from 'node:net';

export interface BindCheckOptions {
  /** Interface to test-bind against. Defaults to `127.0.0.1`. */
  host?: string;
  /** Give up on a single port after this long, in ms. Defaults to `500`. */
  timeoutMs?: number;
}

/**
 * Resolves true when nothing is currently listening on `port`.
 *
 * A test-bind alone is not enough off Linux: macOS and Windows let a bind on
 * `127.0.0.1` succeed while another process listens on `::`, `0.0.0.0` or
 * `::1` (NestJS's default `listen(3000)` binds `::`). So the port also counts
 * as busy when anything accepts a connection on either loopback address.
 */
export async function isPortFree(
  port: number,
  { host = '127.0.0.1', timeoutMs = 500 }: BindCheckOptions = {}
): Promise<boolean> {
  // Connect before binding — otherwise the probe would answer its own bind.
  const answered = await Promise.all([
    acceptsConnection(port, '127.0.0.1', timeoutMs),
    acceptsConnection(port, '::1', timeoutMs),
  ]);
  if (answered.some(Boolean)) return false;
  return canBind(port, host, timeoutMs);
}

function canBind(
  port: number,
  host: string,
  timeoutMs: number
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
 * True only when a connection is accepted. Refusal, an unavailable address
 * (no IPv6), or a timeout all mean nothing is listening there — Windows takes
 * ~2s to refuse a closed loopback port, so the timeout is the common answer.
 */
function acceptsConnection(
  port: number,
  host: string,
  timeoutMs: number
): Promise<boolean> {
  return new Promise((resolvePromise) => {
    const socket = connect({ port, host });
    const settle = (accepted: boolean) => {
      socket.removeAllListeners();
      socket.on('error', () => undefined);
      socket.destroy();
      resolvePromise(accepted);
    };
    socket.setTimeout(timeoutMs, () => settle(false));
    socket.once('connect', () => settle(true));
    socket.once('error', () => settle(false));
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
