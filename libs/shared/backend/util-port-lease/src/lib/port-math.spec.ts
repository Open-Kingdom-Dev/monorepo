import {
  envForSlot,
  findPortCollisions,
  portForSlot,
  portsForSlot,
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

describe('width validation', () => {
  it('recommends the span of the map', () => {
    expect(recommendWidth(MAP)).toBe(4200 - 3000 + 1);
  });

  it('finds no collisions when width covers the span', () => {
    expect(findPortCollisions(MAP, { width: recommendWidth(MAP) }, 16)).toEqual(
      []
    );
  });

  it('reports the exact overlap when width is too small', () => {
    const collisions = findPortCollisions(
      { A: 3000, B: 3010 },
      { width: 10 },
      3
    );
    expect(collisions).toEqual([
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
});
