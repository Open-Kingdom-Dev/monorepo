/**
 * Pure port arithmetic — §2 of docs/Worktree-Port-Leasing.md.
 *
 * A worktree leases one small integer (a slot) and every port it needs is
 * derived as `base + slot * width`. No probing, no per-port bookkeeping.
 */

/** Logical port name (usually the env var a service reads) → its slot-0 base port. */
export type PortMap = Record<string, number>;

export interface BandOptions {
  /**
   * Stride between adjacent slots. Must be at least as large as the span of
   * `PortMap` (see {@link recommendWidth}), rounded up for headroom.
   */
  width: number;
  /**
   * Shifts the whole map into a second band (e.g. a test-harness band that runs
   * alongside the dev band for the same slot). Defaults to `0`.
   */
  bandOffset?: number;
}

const MAX_PORT = 65535;
const MIN_PORT = 1;

/** `base + slot * width + bandOffset`, validated to stay inside the TCP range. */
export function portForSlot(
  base: number,
  slot: number,
  { width, bandOffset = 0 }: BandOptions
): number {
  assertInteger(base, 'base');
  assertInteger(slot, 'slot');
  assertInteger(width, 'width');
  assertInteger(bandOffset, 'bandOffset');
  if (slot < 0) throw new RangeError(`slot must be >= 0, got ${slot}`);
  if (width <= 0) throw new RangeError(`width must be > 0, got ${width}`);

  const port = base + slot * width + bandOffset;
  if (port < MIN_PORT || port > MAX_PORT) {
    throw new RangeError(
      `port ${port} for base ${base} at slot ${slot} falls outside 1-65535`
    );
  }
  return port;
}

/** Resolves every entry of a `PortMap` for one slot. */
export function portsForSlot<M extends PortMap>(
  map: M,
  slot: number,
  band: BandOptions
): Record<keyof M, number> {
  const out = {} as Record<keyof M, number>;
  for (const [name, base] of Object.entries(map)) {
    out[name as keyof M] = portForSlot(base, slot, band);
  }
  return out;
}

/**
 * Same as {@link portsForSlot} but stringified, ready to spread into
 * `process.env` or write to an env file.
 */
export function envForSlot<M extends PortMap>(
  map: M,
  slot: number,
  band: BandOptions
): Record<keyof M & string, string> {
  const ports = portsForSlot(map, slot, band);
  const out = {} as Record<keyof M & string, string>;
  for (const [name, port] of Object.entries(ports)) {
    out[name as keyof M & string] = String(port);
  }
  return out;
}

/**
 * Substitutes `{PORT_NAME}` placeholders in URL templates with the slot's ports.
 *
 * §5's "classic slot ≠ 0 bug" is a derived URL left pointing at an un-offset
 * port — it only shows up outside slot 0. Building every cross-service URL
 * through here keeps them tied to the same lease as the listeners.
 *
 * @throws if a template references a name absent from `ports`.
 */
export function resolveUrlTemplates<T extends Record<string, string>>(
  templates: T,
  ports: Record<string, number>
): Record<keyof T & string, string> {
  const out = {} as Record<keyof T & string, string>;
  for (const [key, template] of Object.entries(templates)) {
    out[key as keyof T & string] = template.replace(
      /\{([A-Za-z0-9_]+)\}/g,
      (_match, name: string) => {
        const port = ports[name];
        if (port === undefined) {
          throw new Error(
            `URL template "${key}" references unknown port "${name}"`
          );
        }
        return String(port);
      }
    );
  }
  return out;
}

export interface DuplicateBase {
  base: number;
  /** Every logical name mapped to this base, in map order. */
  names: string[];
}

/**
 * Names that share a base port.
 *
 * These collide inside *every* slot by construction, so a uniform shift can
 * never separate them — but that is often deliberate: two apps that are never
 * run at the same time can legitimately share a port. Reported separately from
 * {@link findPortCollisions} so a real cross-slot overlap is never buried under
 * intentional sharing.
 */
export function findDuplicateBases(map: PortMap): DuplicateBase[] {
  const byBase = new Map<number, string[]>();
  for (const [name, base] of Object.entries(map)) {
    const names = byBase.get(base);
    if (names) names.push(name);
    else byBase.set(base, [name]);
  }
  return [...byBase.entries()]
    .filter(([, names]) => names.length > 1)
    .map(([base, names]) => ({ base, names }));
}

export interface PortCollision {
  port: number;
  /** `[{ name, slot }, { name, slot }]` — the two allocations that overlap. */
  between: [{ name: string; slot: number }, { name: string; slot: number }];
}

/**
 * Ports that two *different* slots would both be handed.
 *
 * This is the property that actually matters: distinct worktrees must never
 * receive the same port. Two names sharing a base land on each other within
 * every slot and are reported by {@link findDuplicateBases} instead — counting
 * them here would flag a deliberately shared port as a fault at every slot.
 *
 * Intended for a unit test in the consuming repo: it turns "we picked a big
 * enough width" from a comment into an assertion.
 */
export function findPortCollisions(
  map: PortMap,
  band: BandOptions,
  maxSlots: number
): PortCollision[] {
  const byPort = new Map<number, { name: string; slot: number }[]>();

  for (let slot = 0; slot < maxSlots; slot += 1) {
    for (const [name, base] of Object.entries(map)) {
      const port = portForSlot(base, slot, band);
      const holders = byPort.get(port);
      if (holders) holders.push({ name, slot });
      else byPort.set(port, [{ name, slot }]);
    }
  }

  const collisions: PortCollision[] = [];
  for (const [port, holders] of byPort) {
    for (let i = 0; i < holders.length; i += 1) {
      for (let j = i + 1; j < holders.length; j += 1) {
        if (holders[i].slot !== holders[j].slot) {
          collisions.push({ port, between: [holders[i], holders[j]] });
        }
      }
    }
  }
  return collisions.sort((a, b) => a.port - b.port);
}

export interface RecommendWidthOptions {
  /** How many slots the width must stay collision-free across. */
  maxSlots: number;
  /**
   * Floor for the search. Defaults to the number of distinct bases — §2's "at
   * least as large as the number of ports any one stack needs". Raise it for
   * headroom so new services can be added without restriding.
   */
  minWidth?: number;
  /** Ceiling for the search. Defaults to the largest width that keeps every
   * port under 65535 at the highest slot. */
  maxWidth?: number;
}

/**
 * The smallest width that is collision-free across `maxSlots` slots.
 *
 * Searches rather than reasoning from the map's span: the span is a sufficient
 * bound but a wildly loose one. A real map with bases 3000-9018 has a span of
 * 6017 and is provably fine at a width of 65, so returning the span would push
 * callers into a stride nearly a hundred times larger than they need — and
 * out of the port range far sooner.
 *
 * @throws if no width in range works (usually means `maxSlots` is too high).
 */
export function recommendWidth(
  map: PortMap,
  { maxSlots, minWidth, maxWidth }: RecommendWidthOptions
): number {
  if (!Number.isInteger(maxSlots) || maxSlots < 1) {
    throw new RangeError(`maxSlots must be an integer >= 1, got ${maxSlots}`);
  }
  const bases = Object.values(map);
  if (bases.length === 0) return Math.max(1, minWidth ?? 1);

  const floor = Math.max(1, minWidth ?? new Set(bases).size);
  // Above this, the top slot's highest port leaves the TCP range.
  const headroom = MAX_PORT - Math.max(...bases);
  const ceiling =
    maxWidth ??
    (maxSlots === 1 ? MAX_PORT : Math.floor(headroom / (maxSlots - 1)));

  for (let width = floor; width <= ceiling; width += 1) {
    if (findPortCollisions(map, { width }, maxSlots).length === 0) return width;
  }

  throw new Error(
    `No collision-free width in ${floor}..${ceiling} for ${maxSlots} slots. ` +
      `Lower maxSlots, or re-base the map so fewer port differences are ` +
      `multiples of a candidate width.`
  );
}

export interface PortFromEnvOptions {
  /** Environment to read. Defaults to `process.env`. */
  env?: NodeJS.ProcessEnv;
  /** Receives a diagnostic when an env var is set but unusable. */
  onWarning?: (message: string) => void;
}

/**
 * Reads a leased port from the environment, falling back to its slot-0 base.
 *
 * This is the consumer half of the mechanism, and the one every vite,
 * playwright, and test config should call instead of hardcoding a number. With
 * no lease in play it returns the historical port, so the main checkout and CI
 * behave exactly as they did before the mechanism existed.
 *
 * A set-but-unusable value falls back rather than throwing — a stray env var
 * must not be able to stop a dev server — but warns, because silently ignoring
 * it would hide the misconfiguration.
 */
export function portFromEnv<M extends PortMap>(
  name: keyof M & string,
  map: M,
  { env = process.env, onWarning }: PortFromEnvOptions = {}
): number {
  const base = map[name];
  if (base === undefined) {
    throw new Error(
      `Unknown port "${name}". Known: ${Object.keys(map).join(', ')}`
    );
  }

  const raw = env[name];
  if (raw === undefined || raw === '') return base;

  const parsed = Number(raw);
  if (Number.isInteger(parsed) && parsed >= MIN_PORT && parsed <= MAX_PORT) {
    return parsed;
  }

  onWarning?.(`${name}="${raw}" is not a valid port; falling back to ${base}`);
  return base;
}

/** {@link portFromEnv} across a whole map. */
export function portsFromEnv<M extends PortMap>(
  map: M,
  options: PortFromEnvOptions = {}
): Record<keyof M & string, number> {
  const out = {} as Record<keyof M & string, number>;
  for (const name of Object.keys(map)) {
    out[name as keyof M & string] = portFromEnv(
      name as keyof M & string,
      map,
      options
    );
  }
  return out;
}

function assertInteger(value: number, label: string): void {
  if (!Number.isInteger(value)) {
    throw new TypeError(`${label} must be an integer, got ${value}`);
  }
}
