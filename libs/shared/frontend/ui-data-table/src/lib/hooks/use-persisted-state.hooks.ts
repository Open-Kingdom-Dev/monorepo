import { useCallback, useState } from 'react';
import { useDebouncedCallback } from '@react-hookz/web';
import type { TableState } from '@tanstack/react-table';

const STORAGE_PREFIX = 'ok-data-table:v1:';
export const PERSISTENCE_VERSION = 1;
const WRITE_DEBOUNCE_MS = 200;

export type PersistableState = Partial<
  Pick<
    TableState,
    | 'sorting'
    | 'columnOrder'
    | 'columnFilters'
    | 'globalFilter'
    | 'columnSizing'
    | 'columnVisibility'
    | 'columnPinning'
  >
>;

type PersistedBlob = PersistableState & { version: number };

/**
 * `localStorage`-backed persistence for the slices of `TableState` that
 * represent user preferences. Row selection, pagination index, and page size
 * are session concerns and stay out.
 *
 * SSR-safe (`typeof window` guard); JSON parse failures and version mismatches
 * clear the entry and emit a dev warning; `QuotaExceededError` on write is
 * swallowed silently — persistence is best-effort, never load-bearing. Stale
 * entries (column ids removed from the table) are ignored by TanStack at
 * runtime, no pruning needed.
 */
export function usePersistedState(key: string): {
  initial: PersistableState;
  write: (state: PersistableState) => void;
} {
  const storageKey = STORAGE_PREFIX + key;
  const [initial] = useState<PersistableState>(() => hydrate(storageKey));

  const writeNow = useCallback(
    (state: PersistableState) => {
      if (typeof window === 'undefined' || !key) return;
      const blob: PersistedBlob = { version: PERSISTENCE_VERSION, ...state };
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(blob));
      } catch {
        // QuotaExceededError or storage disabled — in-memory state is the
        // source of truth, persistence is purely a best-effort cache.
      }
    },
    [key, storageKey]
  );

  const write = useDebouncedCallback(writeNow, [writeNow], WRITE_DEBOUNCE_MS);

  return { initial, write };
}

function hydrate(storageKey: string): PersistableState {
  if (typeof window === 'undefined') return {};

  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as PersistedBlob;
    if (parsed?.version !== PERSISTENCE_VERSION)
      throw new Error('version mismatch');
    const { version: _v, ...state } = parsed;
    return state;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        `[ui-data-table] could not parse persisted state at "${storageKey}" — clearing.`,
        error
      );
    }
    window.localStorage.removeItem(storageKey);
    return {};
  }
}
