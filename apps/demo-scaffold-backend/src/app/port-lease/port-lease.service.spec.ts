import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PortLeaseService } from './port-lease.service';

const mockLeaseSlot = jest.fn();
const mockFindBusyPorts = jest.fn();

// Stub only the I/O; the port math runs for real.
jest.mock('@open-kingdom/shared-backend-util-port-lease', () => ({
  ...jest.requireActual('@open-kingdom/shared-backend-util-port-lease'),
  leaseSlot: (...args: unknown[]) => mockLeaseSlot(...args),
  findBusyPorts: (...args: unknown[]) => mockFindBusyPorts(...args),
}));

describe('PortLeaseService', () => {
  let dir: string;
  let registryPath: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'port-lease-svc-'));
    registryPath = join(dir, 'port-lease-registry.json');
    writeFileSync(
      registryPath,
      JSON.stringify({
        slots: {
          '1': { path: '/w/feature', branch: 'feature' },
          '0': { path: '/w/main', branch: 'main' },
        },
      })
    );
    mockLeaseSlot.mockReset();
    mockFindBusyPorts.mockReset();
  });

  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it('offsets every port by the slot and flags the busy ones', async () => {
    mockLeaseSlot.mockImplementation(({ onWarning }) => {
      onWarning('stealing stale port lease lock');
      return {
        slot: 1,
        source: 'registry',
        isPrimary: false,
        worktreePath: '/w/feature',
        branch: 'feature',
        registryPath,
      };
    });
    mockFindBusyPorts.mockImplementation(async (ports: number[]) => [ports[0]]);

    const status = await new PortLeaseService().status();

    expect(mockLeaseSlot).toHaveBeenCalledWith(
      expect.objectContaining({ slotCacheEnvVar: false })
    );
    const backend = status.ports.find((p) => p.name === 'PORT');
    expect(backend).toEqual({
      name: 'PORT',
      base: 3000,
      leased: 3000 + status.width,
      busy: true,
    });
    expect(status.ports.filter((p) => p.busy)).toHaveLength(1);
    expect(status.registry.map((r) => [r.slot, r.current])).toEqual([
      [0, false],
      [1, true],
    ]);
    expect(status.warnings).toEqual(['stealing stale port lease lock']);
  });

  it('reports an empty registry when the lease degraded', async () => {
    mockLeaseSlot.mockReturnValue({
      slot: 0,
      source: 'degraded',
      isPrimary: true,
      worktreePath: null,
      branch: null,
      registryPath: null,
    });
    mockFindBusyPorts.mockResolvedValue([]);

    const status = await new PortLeaseService().status();

    expect(status.registry).toEqual([]);
    expect(status.ports.every((p) => p.leased === p.base)).toBe(true);
  });
});
