import {
  envForSlot,
  findDuplicateBases,
  findPortCollisions,
  portForSlot,
  portFromEnv,
  portsForSlot,
  portsFromEnv,
  recommendWidth,
  resolveUrlTemplates,
} from './port-math.js';

const MAP = {
  FRONTEND_PORT: 4200,
  BACKEND_PORT: 3000,
  TWIN_PORT: 3010,
};

describe('portForSlot', () => {
  it('returns the base port at slot 0 so the main checkout never moves', () => {
    expect(portForSlot(3000, 0, { width: 65 })).toBe(3000);
  });

  it('strides by width per slot', () => {
    expect(portForSlot(3000, 1, { width: 65 })).toBe(3065);
    expect(portForSlot(3000, 4, { width: 65 })).toBe(3260);
  });

  it('shifts the whole map when a band offset is given', () => {
    expect(portForSlot(3000, 2, { width: 65, bandOffset: 2000 })).toBe(5130);
  });

  it('rejects a slot outside the TCP range', () => {
    expect(() => portForSlot(60000, 200, { width: 65 })).toThrow(RangeError);
  });

  it.each([
    ['negative slot', 3000, -1, 65],
    ['zero width', 3000, 1, 0],
  ])('rejects %s', (_label, base, slot, width) => {
    expect(() => portForSlot(base, slot, { width })).toThrow(RangeError);
  });

  it('rejects non-integers', () => {
    expect(() => portForSlot(3000.5, 0, { width: 65 })).toThrow(TypeError);
  });
});

describe('portsForSlot / envForSlot', () => {
  it('resolves every entry for one slot', () => {
    expect(portsForSlot(MAP, 2, { width: 65 })).toEqual({
      FRONTEND_PORT: 4330,
      BACKEND_PORT: 3130,
      TWIN_PORT: 3140,
    });
  });

  it('stringifies for direct use as env vars', () => {
    expect(envForSlot(MAP, 1, { width: 65 })).toEqual({
      FRONTEND_PORT: '4265',
      BACKEND_PORT: '3065',
      TWIN_PORT: '3075',
    });
  });
});

describe('resolveUrlTemplates', () => {
  const ports = portsForSlot(MAP, 3, { width: 65 });

  it('substitutes port placeholders so derived URLs follow the slot', () => {
    expect(
      resolveUrlTemplates(
        {
          VITE_API_URL: 'http://localhost:{BACKEND_PORT}/api',
          WEBHOOK_TARGET: 'http://localhost:{BACKEND_PORT}/hooks',
          TWIN_BASE: 'http://127.0.0.1:{TWIN_PORT}',
        },
        ports
      )
    ).toEqual({
      VITE_API_URL: 'http://localhost:3195/api',
      WEBHOOK_TARGET: 'http://localhost:3195/hooks',
      TWIN_BASE: 'http://127.0.0.1:3205',
    });
  });

  it('throws on an unknown placeholder rather than emitting a wrong URL', () => {
    expect(() =>
      resolveUrlTemplates({ X: 'http://localhost:{NOPE}' }, ports)
    ).toThrow(/unknown port "NOPE"/);
  });
});

describe('findPortCollisions', () => {
  it('reports nothing when the width separates every slot', () => {
    expect(findPortCollisions(MAP, { width: 65 }, 16)).toEqual([]);
  });

  it('reports the exact overlap when a width divides a base difference', () => {
    // B(3010) at slot 0 is A(3000) at slot 1.
    expect(findPortCollisions({ A: 3000, B: 3010 }, { width: 10 }, 3)).toEqual([
      {
        port: 3010,
        between: [
          { name: 'B', slot: 0 },
          { name: 'A', slot: 1 },
        ],
      },
      {
        port: 3020,
        between: [
          { name: 'B', slot: 1 },
          { name: 'A', slot: 2 },
        ],
      },
    ]);
  });

  it('orders each pair by slot, and the list by port', () => {
    const collisions = findPortCollisions(
      { A: 3000, B: 3010, C: 3020 },
      { width: 10 },
      4
    );
    expect(collisions.length).toBeGreaterThan(1);
    for (const c of collisions) {
      expect(c.between[0].slot).toBeLessThan(c.between[1].slot);
    }
    const ports = collisions.map((c) => c.port);
    expect(ports).toEqual([...ports].sort((a, b) => a - b));
  });

  it('ignores names that share a base — they collide in every slot by design', () => {
    // Two apps that never run together may legitimately share a port. Counting
    // that here would flag a deliberate choice as a fault at every slot.
    expect(findPortCollisions({ A: 3000, B: 3000 }, { width: 65 }, 8)).toEqual(
      []
    );
  });

  it('still catches a cross-slot overlap in a map that also shares a base', () => {
    const collisions = findPortCollisions(
      { A: 3000, ALIAS: 3000, C: 3010 },
      { width: 10 },
      3
    );
    expect(collisions.length).toBeGreaterThan(0);
    for (const c of collisions) {
      expect(c.between[0].slot).not.toBe(c.between[1].slot);
    }
  });

  it('scales to a real map — 9 ports across 8 slots, no overlap at width 101', () => {
    const real = {
      PORT: 3000,
      FRONTEND_PORT: 4200,
      PREVIEW_PORT: 4300,
      GCS: 9013,
      GMAIL: 9014,
      AUTH: 9015,
      YOUTUBE: 9016,
      CALENDAR: 9017,
      SPOTIFY: 9018,
    };
    expect(findPortCollisions(real, { width: 101 }, 8)).toEqual([]);
  });
});

describe('findDuplicateBases', () => {
  it('finds nothing when every base is distinct', () => {
    expect(findDuplicateBases(MAP)).toEqual([]);
  });

  it('groups the names that share a base', () => {
    expect(
      findDuplicateBases({ A: 3000, B: 4200, ALIAS: 3000, C: 3000 })
    ).toEqual([{ base: 3000, names: ['A', 'ALIAS', 'C'] }]);
  });
});

describe('recommendWidth', () => {
  it('finds a width far tighter than the map span', () => {
    // The span of this map is 6019. Returning that would push callers into a
    // stride ~90x larger than they need, and out of the port range far sooner.
    const map = { A: 3000, B: 4200, C: 4300, D: 9013, E: 9018 };
    const width = recommendWidth(map, { maxSlots: 16 });
    expect(width).toBeLessThan(100);
    expect(findPortCollisions(map, { width }, 16)).toEqual([]);
  });

  it('returns a width whose result is actually collision-free', () => {
    const map = { A: 3000, B: 3010, C: 3100 };
    const width = recommendWidth(map, { maxSlots: 8 });
    expect(findPortCollisions(map, { width }, 8)).toEqual([]);
  });

  it('respects a minWidth floor for headroom', () => {
    const map = { A: 3000, B: 3010, C: 3100 };
    expect(
      recommendWidth(map, { maxSlots: 8, minWidth: 200 })
    ).toBeGreaterThanOrEqual(200);
  });

  it('defaults its floor to the number of distinct bases', () => {
    // Three names, two distinct bases -> floor of 2, not 3.
    expect(
      recommendWidth({ A: 3000, ALIAS: 3000, B: 3007 }, { maxSlots: 2 })
    ).toBe(2);
  });

  it('keeps every port inside the TCP range at the highest slot', () => {
    const map = { A: 3000, B: 60000 };
    const width = recommendWidth(map, { maxSlots: 4 });
    expect(60000 + 3 * width).toBeLessThanOrEqual(65535);
  });

  it('rejects a nonsensical slot count', () => {
    expect(() => recommendWidth(MAP, { maxSlots: 0 })).toThrow(RangeError);
  });

  it('explains itself when no width can work', () => {
    expect(() =>
      recommendWidth({ A: 3000, B: 65535 }, { maxSlots: 100 })
    ).toThrow(/No collision-free width/);
  });
});

describe('portFromEnv', () => {
  const map = { PORT: 3000, FRONTEND_PORT: 4200 };

  it('falls back to the historical port when nothing is leased', () => {
    expect(portFromEnv('PORT', map, { env: {} })).toBe(3000);
  });

  it('reads the leased value when one is present', () => {
    expect(portFromEnv('PORT', map, { env: { PORT: '3101' } })).toBe(3101);
  });

  it.each([
    ['empty', ''],
    ['non-numeric', 'nope'],
    ['fractional', '3000.5'],
    ['out of range', '99999'],
    ['zero', '0'],
  ])('falls back on a %s value rather than yielding nonsense', (_l, raw) => {
    expect(portFromEnv('PORT', map, { env: { PORT: raw } })).toBe(3000);
  });

  it('warns when a value is set but unusable, so the typo is not silent', () => {
    const warnings: string[] = [];
    portFromEnv('PORT', map, {
      env: { PORT: 'nope' },
      onWarning: (m) => warnings.push(m),
    });
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatch(/not a valid port/);
  });

  it('stays silent when the variable is simply absent', () => {
    const warnings: string[] = [];
    portFromEnv('PORT', map, { env: {}, onWarning: (m) => warnings.push(m) });
    expect(warnings).toEqual([]);
  });

  it('throws on a name the map does not define', () => {
    // @ts-expect-error - exercising the runtime guard
    expect(() => portFromEnv('NOPE', map, { env: {} })).toThrow(/Unknown port/);
  });

  it('resolves a whole map, mixing leased and fallback values', () => {
    expect(portsFromEnv(map, { env: { PORT: '3101' } })).toEqual({
      PORT: 3101,
      FRONTEND_PORT: 4200,
    });
  });

  it('round-trips what envForSlot produced', () => {
    const leased = envForSlot(map, 3, { width: 101 });
    expect(portsFromEnv(map, { env: leased })).toEqual(
      portsForSlot(map, 3, { width: 101 })
    );
  });
});
