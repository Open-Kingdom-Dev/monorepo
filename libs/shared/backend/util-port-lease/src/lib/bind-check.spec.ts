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

  it('reports nothing busy for an empty list', async () => {
    await expect(findBusyPorts([])).resolves.toEqual([]);
  });
});
