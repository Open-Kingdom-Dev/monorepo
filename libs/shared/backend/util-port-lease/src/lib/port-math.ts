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

/** The smallest `width` that can never let two slots of this map collide. */
export function recommendWidth(map: PortMap): number {
  const bases = Object.values(map);
  if (bases.length === 0) return 1;
  return Math.max(...bases) - Math.min(...bases) + 1;
}

export interface PortCollision {
  port: number;
  /** `[{ name, slot }, { name, slot }]` — the two allocations that overlap. */
  between: [{ name: string; slot: number }, { name: string; slot: number }];
}

/**
 * Exhaustively checks slots `0..maxSlots - 1` for overlapping ports.
 *
 * Intended for a unit test in the consuming repo: it turns "we picked a big
 * enough width" from a comment into an assertion.
 */
export function findPortCollisions(
  map: PortMap,
  band: BandOptions,
  maxSlots: number
): PortCollision[] {
  const seen = new Map<number, { name: string; slot: number }>();
  const collisions: PortCollision[] = [];

  for (let slot = 0; slot < maxSlots; slot += 1) {
    for (const [name, base] of Object.entries(map)) {
      const port = portForSlot(base, slot, band);
      const prior = seen.get(port);
      if (prior) {
        collisions.push({ port, between: [prior, { name, slot }] });
      } else {
        seen.set(port, { name, slot });
      }
    }
  }
  return collisions;
}

function assertInteger(value: number, label: string): void {
  if (!Number.isInteger(value)) {
    throw new TypeError(`${label} must be an integer, got ${value}`);
  }
}
