# @open-kingdom/shared-backend-util-port-lease

Deterministic, collision-free port allocation for running many development stacks — one per git worktree — on a single machine. No daemon, no configuration, no port-probing races.

Reference implementation of the pattern in [`docs/Worktree-Port-Leasing.md`](../../../../docs/Worktree-Port-Leasing.md).

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

### Validating your width

`width` must exceed the span of your port map, or two slots will overlap. Assert it rather than commenting it:

```typescript
import { findPortCollisions, recommendWidth } from '@open-kingdom/shared-backend-util-port-lease';

it('is collision-free for slots 0-15', () => {
  expect(findPortCollisions(PORT_MAP, BAND, 16)).toEqual([]);
});
// recommendWidth(PORT_MAP) → the smallest width that can never collide
```

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
| `recommendWidth(map)`                                                                                                                    | Smallest width that can never collide                                         |
| `findPortCollisions(map, band, maxSlots)`                                                                                                | Exhaustive overlap check, for a unit test                                     |
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
