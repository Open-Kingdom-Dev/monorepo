/**
 * Pure registry logic — §3 and §4 (steps 3-4) of docs/Worktree-Port-Leasing.md.
 *
 * Everything here is a pure function over plain data so it can be unit-tested
 * without a real git repository. {@link leaseSlot} is the thin I/O wrapper.
 */

export interface SlotRecord {
  /** Normalized worktree path — see {@link normalizeWorktreePath}. */
  path: string;
  /** Cosmetic, for debuggability when reading the registry by hand. */
  branch: string;
}

export interface Registry {
  slots: Record<string, SlotRecord>;
}

export const EMPTY_REGISTRY: Registry = { slots: {} };

/**
 * Canonicalizes a worktree path so the same directory always compares equal.
 *
 * Git and the Node runtime disagree about separators and drive-letter case on
 * Windows; routing every comparison through here is what stops one worktree
 * from leaking duplicate slots.
 */
export function normalizeWorktreePath(input: string): string {
  if (!input) return '';
  let out = input.trim().replace(/\\/g, '/');
  // Collapse repeated separators, but keep a leading `//` UNC prefix intact.
  const uncPrefix = out.startsWith('//') ? '//' : '';
  out = uncPrefix + out.slice(uncPrefix.length).replace(/\/{2,}/g, '/');
  if (out.length > 1) out = out.replace(/\/+$/, '');
  if (/^[a-z]:/.test(out)) out = out[0].toUpperCase() + out.slice(1);
  return out || '/';
}

/** Extracts worktree paths from `git worktree list --porcelain`, in git's order. */
export function parseWorktreePorcelain(stdout: string): string[] {
  const paths: string[] = [];
  for (const line of stdout.split(/\r?\n/)) {
    if (line.startsWith('worktree ')) {
      paths.push(normalizeWorktreePath(line.slice('worktree '.length)));
    }
  }
  return paths;
}

/** Tolerantly reads a registry file's contents; anything malformed reads as empty. */
export function parseRegistry(raw: string | null | undefined): Registry {
  if (!raw) return { slots: {} };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { slots: {} };
  }
  if (!parsed || typeof parsed !== 'object') return { slots: {} };

  const slotsInput = (parsed as { slots?: unknown }).slots;
  if (!slotsInput || typeof slotsInput !== 'object') return { slots: {} };

  const slots: Record<string, SlotRecord> = {};
  for (const [key, value] of Object.entries(
    slotsInput as Record<string, unknown>
  )) {
    const slot = Number(key);
    if (!Number.isInteger(slot) || slot < 0) continue;
    if (!value || typeof value !== 'object') continue;

    const path = (value as { path?: unknown }).path;
    if (typeof path !== 'string' || path === '') continue;

    const branch = (value as { branch?: unknown }).branch;
    slots[String(slot)] = {
      path: normalizeWorktreePath(path),
      branch: typeof branch === 'string' ? branch : '',
    };
  }
  return { slots };
}

/** Stable, human-diffable serialization (slots ordered numerically). */
export function serializeRegistry(registry: Registry): string {
  const slots: Record<string, SlotRecord> = {};
  for (const slot of sortedSlots(registry)) {
    slots[String(slot)] = registry.slots[String(slot)];
  }
  return `${JSON.stringify({ slots }, null, 2)}\n`;
}

/**
 * Drops slots whose worktree no longer exists — §4 step 3.
 *
 * Lazy pruning is what keeps a churn of created-and-deleted worktrees from
 * exhausting slot space, with no delete hook to install or forget.
 */
export function pruneRegistry(
  registry: Registry,
  livePaths: string[]
): Registry {
  const live = new Set(livePaths.map(normalizeWorktreePath));
  const slots: Record<string, SlotRecord> = {};
  for (const [key, record] of Object.entries(registry.slots)) {
    if (live.has(record.path)) slots[key] = record;
  }
  return { slots };
}

export interface SelectSlotInput {
  /** The worktree asking for a slot. */
  worktreePath: string;
  /** The clone's primary worktree — the first entry of `git worktree list`. */
  primaryWorktreePath: string;
  /** Current branch, recorded for debuggability only. */
  branch?: string;
}

export interface SelectSlotResult {
  slot: number;
  /** The registry with this lease applied. Input is never mutated. */
  registry: Registry;
  /** True when the caller is the primary worktree, pinned to slot 0. */
  isPrimary: boolean;
  /** True when the worktree already held this slot and simply kept it. */
  reused: boolean;
}

/**
 * Picks this worktree's slot — §4 step 4.
 *
 * Precedence: the primary worktree is always pinned to slot 0 (so the main
 * checkout keeps the project's historical ports forever), a worktree already in
 * the registry reuses its slot (so ports survive restarts), otherwise it claims
 * the lowest free slot >= 1.
 */
export function selectSlot(
  registry: Registry,
  { worktreePath, primaryWorktreePath, branch = '' }: SelectSlotInput
): SelectSlotResult {
  const path = normalizeWorktreePath(worktreePath);
  const primary = normalizeWorktreePath(primaryWorktreePath);
  const isPrimary = path === primary && path !== '';

  const slots: Record<string, SlotRecord> = { ...registry.slots };
  const existing = Object.entries(slots).find(
    ([, record]) => record.path === path
  );

  if (isPrimary) {
    // Evict whoever currently holds 0, and release this worktree's old slot if
    // it had been leased a non-zero one before becoming primary.
    if (existing && existing[0] !== '0') delete slots[existing[0]];
    slots['0'] = { path, branch };
    return {
      slot: 0,
      registry: { slots },
      isPrimary: true,
      reused: existing?.[0] === '0',
    };
  }

  if (existing) {
    const slot = Number(existing[0]);
    slots[existing[0]] = { path, branch };
    return { slot, registry: { slots }, isPrimary: false, reused: true };
  }

  const slot = lowestFreeSlot(slots);
  slots[String(slot)] = { path, branch };
  return { slot, registry: { slots }, isPrimary: false, reused: false };
}

/** Lowest unused slot >= 1 — slot 0 is reserved for the primary worktree. */
export function lowestFreeSlot(slots: Record<string, SlotRecord>): number {
  const taken = new Set(
    Object.keys(slots)
      .map(Number)
      .filter((n) => Number.isInteger(n))
  );
  let slot = 1;
  while (taken.has(slot)) slot += 1;
  return slot;
}

function sortedSlots(registry: Registry): number[] {
  return Object.keys(registry.slots)
    .map(Number)
    .sort((a, b) => a - b);
}
