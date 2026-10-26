import { createServer, Server } from 'node:net';

import { findBusyPorts, isPortFree } from './bind-check.js';

describe('bind check', () => {
  let server: Server;
  let busyPort: number;

  beforeEach(async () => {
    server = createServer();
    await new Promise<void>((resolve) =>
      server.listen({ port: 0, host: '127.0.0.1' }, resolve)
    );
    const address = server.address();
    if (typeof address === 'string' || address === null) {
      throw new Error('expected a TCP address');
    }
    busyPort = address.port;
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('reports a listening port as not free', async () => {
    await expect(isPortFree(busyPort)).resolves.toBe(false);
  });

  it('reports an unbound port as free', async () => {
    // Port 0 asks the OS for any free port, so the bind always succeeds.
    await expect(isPortFree(0)).resolves.toBe(true);
  });

  it('returns only the busy ports, preserving input order', async () => {
    await expect(findBusyPorts([0, busyPort, 0])).resolves.toEqual([busyPort]);
  });

  // Off Linux a bind on 127.0.0.1 succeeds beside these, so only the connect
  // probe catches them. A host the machine lacks (no IPv6) is skipped.
  it.each(['::', '0.0.0.0', '::1'])(
    'reports a port busy when the listener is on %s',
    async (host) => {
      const other = createServer();
      const port = await new Promise<number | null>((resolve) => {
        other.once('error', () => resolve(null));
        other.listen({ port: 0, host }, () => {
          const address = other.address();
          resolve(typeof address === 'object' && address ? address.port : null);
        });
      });
      if (port === null) return;
      try {
        await expect(isPortFree(port)).resolves.toBe(false);
      } finally {
        await new Promise<void>((resolve) => other.close(() => resolve()));
      }
    }
  );

  it('reports nothing busy for an empty list', async () => {
    await expect(findBusyPorts([])).resolves.toEqual([]);
  });
});
