# @open-kingdom/shared-backend-util-port-lease

Deterministic, collision-free port allocation for running many development stacks — one per git worktree — on a single machine. No daemon, no configuration, no port-probing races.

Reference implementation of the pattern in [`docs/Worktree-Port-Leasing.md`](./docs/Worktree-Port-Leasing.md), which ships with this package. A runnable end-to-end script is in [`examples/port-lease-demo.mjs`](./examples/port-lease-demo.mjs).

## Quickstart

Declare your slot-0 ports once, lease a slot, derive everything from it:

```typescript
import { leaseSlot, portsForSlot, envForSlot } from '@open-kingdom/shared-backend-util-port-lease';

const PORT_MAP = { FRONTEND_PORT: 4200, BACKEND_PORT: 3000 } as const;
const BAND = { width: 65 }; // not arbitrary — see "Validating your width" below

const { slot } = leaseSlot(); // 0 in the main checkout, 1+ in each worktree
Object.assign(process.env, envForSlot(PORT_MAP, slot, BAND));

portsForSlot(PORT_MAP, slot, BAND);
// slot 0 → { FRONTEND_PORT: 4200, BACKEND_PORT: 3000 }  ← unchanged
// slot 1 → { FRONTEND_PORT: 4265, BACKEND_PORT: 3065 }
```

Then read the ports back wherever they're consumed — a vite config, a Playwright config, a `main.ts` — instead of hardcoding a number:

```typescript
import { portFromEnv } from '@open-kingdom/shared-backend-util-port-lease';

const port = portFromEnv('BACKEND_PORT', PORT_MAP); // leased value, or 3000
```

That's the whole mechanism. The rest of this README covers picking a safe `width`, keeping derived URLs in step with the listeners, and persisting a lease to disk.

## The idea

Don't allocate individual ports. Allocate each worktree one small integer — a **slot** — and derive every port arithmetically:

```
port = base + slot × width
```

Slots live in a JSON registry inside the **git common directory** (`git rev-parse --git-common-dir`), which resolves to the same `<main-checkout>/.git` from every worktree of a clone. That gives all worktrees a shared rendezvous point for free.

The primary worktree is always pinned to slot 0, so the main checkout keeps the project's historical ports forever and the mechanism is invisible until a second worktree appears.

## Usage

### Dev launcher

```typescript
import { leaseSlot, portsForSlot, envForSlot, resolveUrlTemplates, findBusyPorts } from '@open-kingdom/shared-backend-util-port-lease';

const PORT_MAP = {
  FRONTEND_PORT: 4200,
  BACKEND_PORT: 3000,
  TWIN_PORT: 3010,
} as const;

const BAND = { width: 1250 };

const lease = leaseSlot({ onWarning: (m) => console.warn(`[ports] ${m}`) });
const ports = portsForSlot(PORT_MAP, lease.slot, BAND);

Object.assign(process.env, envForSlot(PORT_MAP, lease.slot, BAND));

// Derive every cross-service URL from the same lease — see the pitfall below.
Object.assign(
  process.env,
  resolveUrlTemplates(
    {
      VITE_API_BASE_URL: 'http://localhost:{BACKEND_PORT}',
      TWIN_BASE_URL: 'http://127.0.0.1:{TWIN_PORT}',
    },
    ports
  )
);

// Diagnostic only: warn loudly, never reassign.
const busy = await findBusyPorts(Object.values(ports));
if (busy.length) {
  console.warn(`[ports] slot ${lease.slot} — already bound: ${busy.join(', ')}`);
}
```

### Test-harness config

Lease as the config's very first act in the main process. `leaseSlot` is synchronous precisely so it can run here, before workers spawn.

```typescript
import { leaseSlot, envForSlot } from '@open-kingdom/shared-backend-util-port-lease';

const { slot } = leaseSlot(); // caches into __PORT_SLOT__
Object.assign(process.env, envForSlot(PORT_MAP, slot, { width: 1250 }));
```

Child processes the runner spawns re-import this config; they read `__PORT_SLOT__` from the inherited environment and reuse the parent's slot instead of each re-leasing. Set `slotCacheEnvVar: false` to opt out.

### Reading the ports back (the consumer half)

Every vite, playwright, or test config should read its port through `portFromEnv` rather than hardcoding a number. With no lease in play it returns the historical port, so the main checkout and CI are unchanged:

```typescript
import { portFromEnv } from '@open-kingdom/shared-backend-util-port-lease';

const backendPort = portFromEnv('PORT', PORT_MAP);
const previewPort = portFromEnv('PREVIEW_PORT', PORT_MAP);

// Build derived URLs from the same value, never a repeated literal — they must
// agree or Playwright's reuseExistingServer attaches to one server while the
// specs drive another.
const previewURL = `http://localhost:${previewPort}`;
```

This is the half that keeps a port from being retyped anywhere: `envForSlot` publishes, `portFromEnv` reads. A set-but-unusable value falls back to the base rather than throwing — a stray env var must not stop a dev server — but calls `onWarning`, so the typo is not silent.

### Persisting the lease to an env file

The launcher exports ports to its children, but a developer who hand-restarts a single service starts a process the launcher never touched. Write the lease to a git-ignored env file so that process picks up the same block:

```typescript
import { writeEnvFile } from '@open-kingdom/shared-backend-util-port-lease';

const { action } = writeEnvFile({
  filePath: join(workspaceRoot, '.local.env'),
  env: { ...envForSlot(PORT_MAP, lease.slot, BAND), ...urls },
  slot: lease.slot,
  branch: lease.branch,
  worktreePath: lease.worktreePath,
  notes: ['Regenerate with `npm run ports:lease`.'],
});
if (action === 'skipped-foreign') {
  console.warn('.local.env was hand-written; left alone.');
}
```

Two behaviours worth knowing:

- **Slot 0 removes the file** rather than writing it. The primary worktree's ports are already the historical ones, so a file would only be a second place for them to drift — and its absence keeps the main checkout and CI byte-identical to before the lease existed. Pass `removeAtSlotZero: false` to opt out.
- **A file whose first line is not the header is never touched**, so a hand-authored file predating the lease is reported (`skipped-foreign`) rather than clobbered.

If your runner reads a specific filename, mind its precedence. Nx loads `.env.local`, then `.local.env`, then `.env`, first value winning — so writing `.local.env` leaves `.env.local` free for a developer's own overrides while still beating the checked-in defaults.

### Validating your width

`width` must not let two _different slots_ land on the same port. Assert it rather than commenting it:

```typescript
import { findPortCollisions, findDuplicateBases, recommendWidth } from '@open-kingdom/shared-backend-util-port-lease';

const MAX_SLOTS = 16;

it('is collision-free for slots 0-15', () => {
  expect(findPortCollisions(PORT_MAP, BAND, MAX_SLOTS)).toEqual([]);
});

// Searches for the smallest width that passes that same check.
const width = recommendWidth(PORT_MAP, { maxSlots: MAX_SLOTS, minWidth: 50 });
```

`findPortCollisions` reports only **cross-slot** overlaps. Two names sharing a base collide inside every slot by construction and no uniform shift can separate them — but that is frequently deliberate (two apps that never run at the same time may share a port), so it is reported by `findDuplicateBases` instead. Counted as collisions, a deliberate choice would look like a fault at every slot and bury the real overlaps.

`recommendWidth` searches upward from `minWidth` (default: the number of distinct bases, per §2's "at least as large as the number of ports any one stack needs") for the first collision-free width that also keeps every port inside the TCP range at the highest slot. It deliberately does **not** return the map's span: for a real map with bases 3000-9018 the span is 6017 where 65 is provably fine, so the span is a sufficient bound but a useless recommendation. Round the result up for headroom.

## Pitfall — the classic slot ≠ 0 bug

A service listening on its slot-offset port while its client still holds the un-offset URL. Everything passes in the main worktree — slot 0, where offset and default coincide — and fails mysteriously in every other worktree. Build every derived URL (webhook targets, login redirects, proxy destinations, health checks) through `resolveUrlTemplates` so it can't drift from the listener.

## API

| Export                                                                                                                                   | Purpose                                                                       |
| ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `leaseSlot(options?)`                                                                                                                    | Claim this worktree's slot. Synchronous. Never throws — degrades to slot 0.   |
| `portForSlot(base, slot, band)`                                                                                                          | `base + slot × width + bandOffset`, range-checked                             |
| `portsForSlot(map, slot, band)`                                                                                                          | Resolve a whole `PortMap` for one slot                                        |
| `envForSlot(map, slot, band)`                                                                                                            | Same, stringified for `process.env` or an env file                            |
| `resolveUrlTemplates(templates, ports)`                                                                                                  | Substitute `{PORT_NAME}` placeholders; throws on an unknown name              |
| `portFromEnv(name, map, opts?)`                                                                                                          | Read a leased port, falling back to its base — the consumer half              |
| `portsFromEnv(map, opts?)`                                                                                                               | Same, across a whole map                                                      |
| `recommendWidth(map, {maxSlots, minWidth?})`                                                                                             | Smallest collision-free width, by search                                      |
| `findPortCollisions(map, band, maxSlots)`                                                                                                | Cross-slot overlap check, for a unit test                                     |
| `findDuplicateBases(map)`                                                                                                                | Names sharing a base — collide in every slot, often deliberate                |
| `renderEnvFile(opts)` / `parseEnvFile(text)`                                                                                             | Serialize / read a lease as dotenv                                            |
| `writeEnvFile(opts)`                                                                                                                     | Write, remove at slot 0, or refuse a foreign file                             |
| `isPortFree(port)` / `findBusyPorts(ports)`                                                                                              | Startup diagnostic — surface, never reassign                                  |
| `normalizeWorktreePath`, `parseWorktreePorcelain`, `parseRegistry`, `serializeRegistry`, `pruneRegistry`, `selectSlot`, `lowestFreeSlot` | Pure registry internals, exported for testing and for custom leasing policies |

### `leaseSlot` options

| Option             | Default                    | Purpose                                                     |
| ------------------ | -------------------------- | ----------------------------------------------------------- |
| `cwd`              | `process.cwd()`            | Directory to resolve the worktree from                      |
| `registryFileName` | `port-lease-registry.json` | File name inside the git common dir                         |
| `slotCacheEnvVar`  | `__PORT_SLOT__`            | Env var children inherit the slot through; `false` disables |
| `env`              | `process.env`              | Environment read for the cache and written back to          |
| `lockRetryMs`      | `25`                       | Pause between lock attempts                                 |
| `lockStaleMs`      | `5000`                     | After this long, a held lock is assumed crashed and stolen  |
| `onWarning`        | no-op                      | Receives non-fatal diagnostics                              |

### Result

`leaseSlot` returns `{ slot, worktreePath, branch, registryPath, isPrimary, source }`, where `source` is `registry` (leased normally), `cache` (inherited via the slot-cache env var), or `degraded` (not a git worktree, or the registry was unusable — slot 0).

## Guarantees

- **Deterministic** — the same worktree gets the same ports on every run.
- **Collision-free by construction** — distinct slots can't overlap, so there is no probing and no probe race.
- **Self-healing** — slots whose worktree no longer appears in `git worktree list` are pruned lazily; no cleanup hooks to install or forget.
- **Crash-proof** — `mkdir` lock with stale-steal, temp-file + rename registry writes.
- **Free when unused** — outside git, or in a single checkout, it costs nothing and yields slot 0.
