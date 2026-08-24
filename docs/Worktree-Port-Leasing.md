# Worktree Port Leasing

_Engineering pattern · Reference implementation guide_

Deterministic, collision-free port allocation for running many development stacks — one per git worktree — on a single machine, with no daemon, no configuration, and no port-probing races.

---

## §1 · Problem — Every worktree wants the same ports

A development stack binds a fixed set of TCP ports: a frontend dev server, one or more backend services, sometimes local test doubles (a fake payment API, a fake webhook receiver). When developers keep multiple git worktrees of the same repository on one machine — parallel feature branches, agent-driven development, concurrent test runs — every worktree tries to bind the same well-known ports and they collide.

The ad-hoc fixes are all fragile. Random ports change between runs and break bookmarks and env files. Manual overrides rot. Probe-for-a-free-port races when two stacks start in the same instant, and leaves derived URLs (webhooks, redirects, cross-service callbacks) pointing at the wrong place.

---

## §2 · Core idea — Lease slots, not ports

Don't allocate individual ports. Allocate each worktree a single small integer — a **slot** (0, 1, 2, …) — and derive every port it needs arithmetically:

```
port = base_port + (slot × WIDTH)
```

`WIDTH` is a fixed stride at least as large as the number of ports any one stack needs (round up for headroom). One slot can drive multiple port _bands_ at once — say, a "dev" band and a "test harness" band with different bases — as long as the bases are spaced far enough apart that offset blocks from one band can never walk into another. That lets a single worktree run its dev stack _and_ its test stack concurrently, and lets N worktrees do the same, all conflict-free.

| Band          | slot 0 (main worktree) | slot 1 (worktree A) | slot 2 (worktree B) | slot 3 (free) |     |
| ------------- | ---------------------- | ------------------- | ------------------- | ------------- | --- |
| **dev band**  | `base + 0·W`           | `base + 1·W`        | `base + 2·W`        | `base + 3·W`  | ··· |
| **test band** | `base′ + 0·W`          | `base′ + 1·W`       | `base′ + 2·W`       | `base′ + 3·W` | ··· |

> Each leased slot claims the same offset in every band. A block holds a whole stack's ports (frontend, services, test doubles) — `W` is the stride between blocks.

Three properties fall out of the arithmetic:

- **Deterministic** — the same worktree gets the same ports on every run.
- **Collision-free by construction** — distinct slots can't overlap, so there is no port-probing and no probe race.
- **Complete** — derived URLs (webhook targets, login redirects, proxy destinations) are computed from the same slot, so nothing is left pointing at a hardcoded port.

---

## §3 · Registry — A shared file in the git common directory

Slots are recorded in a small JSON registry mapping `slot → { path, branch }`. The trick is _where_ it lives: in the **git common directory** — the directory `git rev-parse --git-common-dir` resolves to — which is the same `<main-checkout>/.git` from every worktree of a clone.

That gives all worktrees a shared, machine-local rendezvous point with no daemon, no server, and no global machine state. The registry naturally scopes to the clone: two unrelated clones don't interfere (they're separate projects; space their bases if they must coexist).

```json
{
  "slots": {
    "0": { "path": "/work/project", "branch": "main" },
    "1": { "path": "/work/project-feature-x", "branch": "feature-x" },
    "2": { "path": "/work/project-bugfix", "branch": "fix/login" }
  }
}
```

---

## §4 · Algorithm — The lease, step by step

A single synchronous function — call it `leaseSlot()` — runs at stack startup:

1. **Gather facts from git**

   The common dir (registry location), the current worktree's top-level path, the current branch (cosmetic, for debuggability), and the list of all live worktree paths from `git worktree list --porcelain` — the first entry is always the primary worktree. If any of this fails (not a git repo), **degrade to slot 0**: plain single-stack behavior, zero configuration for the simple case.

2. **Take a lock**

   Concurrent worktrees can start in the same instant, so the read-modify-write must be serialized. An atomic `mkdir` of a lock directory next to the registry is a portable, dependency-free mutex: it either succeeds (you hold the lock) or fails (someone else does — sleep ~25 ms and retry). Add **stale-lock stealing**: after a deadline of a few seconds, forcibly remove and re-take the lock so a crashed process can never permanently wedge startup. Always release in a `finally`.

3. **Prune dead entries**

   Drop any slot whose recorded worktree path no longer appears in the live-worktree list. This keeps a churn of created-and-deleted worktrees from exhausting slot space — cleanup is lazy and automatic, with no delete hooks to install or forget.

4. **Select a slot**

   - The **primary worktree is always pinned to slot 0** (evicting any stale holder). The main checkout keeps the project's historical, documented ports forever — bookmarks, muscle memory, and existing docs keep working, and adopting the mechanism is invisible to anyone who never uses worktrees.
   - A worktree **already in the registry reuses its slot** — ports are stable across restarts.
   - Otherwise, claim the **lowest free slot ≥ 1**.

5. **Write atomically**

   Serialize the updated registry to a temp file (suffix it with the PID) and `rename` it over the real file, so a crash mid-write can't corrupt the registry.

### Implementation notes that matter in practice

- **Normalize paths before comparing them.** Git and your runtime may report the same directory with different slash styles or drive-letter casing (especially on Windows). Route every comparison through one canonicalizer — absolute, consistent separators, case-folded drive letter, no trailing slash — or the same worktree will leak duplicate slots.
- **Keep it synchronous and network-free.** Test-runner configs often load synchronously before workers spawn; a lease that needs async I/O or a network call can't run there.
- **Separate the pure logic from the I/O.** Port math, pruning, slot selection, path normalization, and porcelain parsing are all pure functions — trivially unit-testable without a real repo. Keep `leaseSlot()` a thin git/filesystem wrapper around them.

---

## §5 · Consumers — Wiring the slot into every process

The lease is only half the mechanism; the other half is making every process actually _use_ the slot's ports. Two integration patterns cover most stacks.

### The dev launcher

Wrap your "start everything" script — whatever runs your process manager — so it leases a slot, computes the dev-band ports, exports them as environment variables that every service reads (with the slot-0 values as each service's hardcoded fallback, preserving zero-config behavior), and then starts the children. Additionally:

- **Persist the ports to a git-ignored env file in the worktree**, so a developer hand-restarting a single service picks up the same block instead of falling back to defaults.
- **Derive every cross-service URL from the slot too** — login and redirect URLs, callback targets, proxy destinations. Any URL left hardcoded will point at _some other worktree's_ stack, a far more confusing failure than a port collision.
- **Add a diagnostic bind-check**: if a leased port is already bound, _warn loudly but do not reassign_. The registry guarantees no other worktree holds this block, so a busy port means a stale or foreign process on the machine — and silently grabbing a different port could steal a block another worktree has legitimately leased. Surface it; let the service fail loudly.

### The test harness

Have the test runner's config lease a slot — same registry, same slot, different band bases — as its very first act in the main process. Then:

- **Cache the slot in an environment variable** (e.g. `__PORT_SLOT__`) and check it before leasing. Test runners spawn many child processes — workers, managed servers — that re-import the config; children must inherit the parent's slot rather than each re-leasing.
- **Push the computed ports into every env var your services and test doubles read**, including every derived URL: webhook targets, base URLs the app redirects to, health-check endpoints.

> **THE CLASSIC SLOT ≠ 0 BUG**
>
> A test double listening on its slot-offset port while its client is still configured with the un-offset URL. Everything passes in the main worktree (slot 0, where offset and default coincide) and fails mysteriously everywhere else. Audit every URL your harness constructs.

---

## §6 · Rationale — Design decisions worth copying

| Decision                                                  | Why                                                                                      |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Slots + arithmetic, not per-port allocation               | One lease covers arbitrarily many ports and bands; nothing to keep consistent per-port.  |
| Registry in the git common dir                            | Free rendezvous shared by all worktrees; no daemon; scoped per clone.                    |
| Registry is authoritative; no port probing for allocation | Eliminates probe races between simultaneously-starting stacks.                           |
| Primary worktree pinned to slot 0                         | Historical ports never move; the mechanism is invisible until a second worktree appears. |
| Stable slot reuse per worktree                            | Ports survive restarts; env files and open browser tabs stay valid.                      |
| Lazy pruning against `git worktree list`                  | No cleanup hooks; slot space self-heals as worktrees come and go.                        |
| `mkdir` lock with stale-steal deadline                    | Portable mutex with no dependencies; crash-proof.                                        |
| Temp-file + rename registry writes                        | Crash-safe persistence.                                                                  |
| Bind-check warns, never reassigns                         | Stale processes get surfaced instead of causing silent block-stealing.                   |
| Graceful degradation outside git                          | The mechanism costs nothing in non-repo or single-checkout contexts.                     |

---

## §7 · Adapting it — Porting this to your project

To adopt the mechanism elsewhere:

1. **Enumerate every port** your full stack binds — including test doubles.
2. **Pick a `WIDTH`** comfortably larger than that count.
3. **Choose base blocks for each band** you need (dev, test, anything else), spaced widely enough apart that `base + WIDTH × max_expected_slots` from one band never reaches the next.
4. **Keep your existing well-known ports as the slot-0 bases**, so the main checkout is unaffected.
5. **Write the lease module** (~150 lines: pure port math + slot selection + pruning, a thin git/filesystem wrapper, the `mkdir` lock) and unit-test the pure parts.
6. **Integrate the two consumers**: the dev launcher and the test-harness config, auditing every derived URL as you go.

---

_Worktree Port Leasing — a pattern for deterministic multi-stack development on one machine. Free to adapt; no project-specific values above carry meaning beyond illustration._

---

## §8 · This workspace's implementation

The mechanism above is implemented here as a publishable library, [`libs/shared/backend/util-port-lease`](../libs/shared/backend/util-port-lease/README.md) → `@open-kingdom/shared-backend-util-port-lease`, so other repositories can consume it rather than re-derive it.

| §7 step                         | Here                                                                                                                             |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Write the lease module          | `port-math.ts` + `registry.ts` (pure) behind `lease.ts` (git, `mkdir` lock, atomic write); `bind-check.ts` for the §5 diagnostic |
| Unit-test the pure parts        | `*.spec.ts` — pure functions directly, plus `leaseSlot` against real `git worktree` checkouts in a temp dir                      |
| Keep well-known ports at slot 0 | `leaseSlot` pins the primary worktree to slot 0, so the main checkout is unaffected and needs no env file                        |
| Enumerate every port            | **Not done** — deliberately left to the consumer as a `PortMap` argument, since the library ships to other repos                 |
| Pick a `WIDTH`                  | **Not done** — a consumer argument; `recommendWidth()` computes it and `findPortCollisions()` asserts it in a unit test          |
| Choose base blocks              | **Not done** — a consumer argument; `BandOptions.bandOffset` carries the second band when one is needed                          |
| Integrate the consumers         | **Not done** — this workspace's own dev launcher and Nx env files are not yet wired to the lease                                 |

The library is the mechanism only. Adopting it _in this workspace_ is still §7 steps 1-3 and 6: enumerate the ports the monorepo's stack binds, pick a width, and wire `npm run dev`, the Nx target env files, and the Playwright/Jest e2e configs to `leaseSlot()` — auditing every derived URL on the way, per the slot ≠ 0 warning in §5.

One design note worth naming for whoever does that wiring:

- **`PORT` is the awkward one.** §5 says export the ports as environment variables every service reads. A bare `PORT` is the exception when several apps read it without sharing a base — a single global value can only ever be right for one of them. Scope it per child process instead of exporting it globally.
