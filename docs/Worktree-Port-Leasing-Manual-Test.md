# Worktree Port Leasing — Manual Test Procedure

How to exercise [`@open-kingdom/shared-backend-util-port-lease`](../libs/shared/backend/util-port-lease/README.md) by hand, end to end, and what correct output looks like at each step.

The unit suite (`npx nx test @open-kingdom/shared-backend-util-port-lease`, 65 tests) already covers this logic — including `leaseSlot` against real `git worktree` checkouts in a temp dir. This procedure is for when you want to watch the mechanism work against _this_ repo with _this_ repo's ports, before wiring the real consumers.

Every output block below was captured from an actual run.

---

## Setup

```bash
npx nx build @open-kingdom/shared-backend-util-port-lease
export DEMO="$(git rev-parse --show-toplevel)/libs/shared/backend/util-port-lease/examples/port-lease-demo.mjs"
```

`examples/port-lease-demo.mjs` uses this repo's real ports as slot-0 bases — backend `3000`, vite dev `4200`, vite preview / e2e baseURL `4300`, twins `9013`–`9018` — and resolves the built library through the git common dir when there is no build beside it. That last detail matters: it means the script runs from a freshly-added worktree that has no `node_modules` of its own.

Nothing here needs the dev servers running. The demo only leases and prints.

---

## 1 · Baseline — the main checkout never moves

```bash
node "$DEMO"
```

```
  SLOT     : 0   (registry, primary)
  ports:
    PORT                        3000   (base)
    FRONTEND_PORT               4200   (base)
    PREVIEW_PORT                4300   (base)
    GCS_TWIN_PORT               9013   (base)
    ...
```

**Expect:** slot 0, and _every port at its base_. This is the property that makes the mechanism safe to adopt — bookmarks, muscle memory, and existing docs keep working for anyone who never uses worktrees.

A registry appears at `.git/port-lease-registry.json` with a single entry.

---

## 2 · A second and third worktree get their own blocks

```bash
git worktree add -b tmp-a /tmp/ok-a
git worktree add -b tmp-b /tmp/ok-b

(cd /tmp/ok-a && node "$DEMO")
(cd /tmp/ok-b && node "$DEMO")
```

```
  SLOT     : 1   →  PORT 3051, FRONTEND 4251, twins 9064-9069
  SLOT     : 2   →  PORT 3102, FRONTEND 4302, twins 9115-9120
```

**Expect:** distinct slots, every port shifted by `slot × width` uniformly. Note the derived URLs in the output shift with them — `YOUTUBE_TWIN_URL` reads `http://127.0.0.1:9118` at slot 2, not the base `9016`. That is the whole point; see §5 of the pattern doc on the classic slot ≠ 0 bug.

One registry serves all three worktrees:

```bash
cat .git/port-lease-registry.json
```

```json
{
  "slots": {
    "0": { "path": "/Users/you/ok-monorepo", "branch": "master" },
    "1": { "path": "/tmp/ok-a", "branch": "tmp-a" },
    "2": { "path": "/tmp/ok-b", "branch": "tmp-b" }
  }
}
```

---

## 3 · Slots are stable across restarts

```bash
(cd /tmp/ok-a && node "$DEMO")   # slot 1 again
node "$DEMO"                     # still slot 0
```

**Expect:** identical slots to step 2. Ports survive restarts, so env files and open browser tabs stay valid.

---

## 4 · Pruning is lazy and automatic

```bash
git worktree remove --force /tmp/ok-a && git branch -D tmp-a
(cd /tmp/ok-b && node "$DEMO") >/dev/null    # any lease prunes
cat .git/port-lease-registry.json            # slot 1 is gone
```

Then confirm the freed slot is reclaimed:

```bash
git worktree add -b tmp-c /tmp/ok-c
(cd /tmp/ok-c && node "$DEMO")
```

```
  SLOT     : 1   →  PORT 3051
```

**Expect:** slot 1 dropped when its worktree vanished, then handed to the next newcomer. No delete hooks, and a churn of created-and-deleted worktrees can't exhaust slot space.

---

## 5 · Concurrency — the part most worth checking yourself

This is what the `mkdir` lock exists for. Fire several leases at once:

```bash
for d in "$PWD" /tmp/ok-b /tmp/ok-c; do
  ( cd "$d" && node "$DEMO" | grep SLOT ) &
done; wait
```

A wider run — six simultaneous leases across five worktrees, with one worktree deliberately racing itself — produced:

```
   1  tmp-e
   0  master
   2  tmp-c
   3  tmp-d
   4  tmp-b
   4  tmp-b        ← same worktree, same slot, both times
```

**Expect:** all distinct slots, and a worktree that leases twice concurrently gets the _same_ slot both times. Any repeat across _different_ worktrees is a real bug — capture the registry and the ordering.

---

## 6 · Bind-check warns, never reassigns

Occupy a port the lease is about to hand out:

```bash
node -e "require('net').createServer().listen(3000,'127.0.0.1');setTimeout(()=>{},8000)" &
node "$DEMO" | grep -E 'SLOT|bound'
```

```
  SLOT     : 0   (registry, primary)
  ⚠ already bound (stale/foreign process — NOT reassigned): 3000
```

**Expect:** a loud warning and _the same slot_. The registry already guarantees no other worktree holds this block, so a busy port means a stale or foreign process. Silently grabbing a different port could steal a block another worktree legitimately leased.

---

## 7 · Graceful degradation

The demo script locates the library through git too, so outside a repo it needs `OK_ROOT` to find the build:

```bash
(cd /tmp && OK_ROOT="$(git -C ~/IdeaProjects/ok-monorepo rev-parse --show-toplevel)" node "$DEMO")
```

```
  ⚠ not a git worktree (/private/tmp); degrading to slot 0
  worktree : (degraded)
  SLOT     : 0   (degraded, primary)
```

**Expect:** a warning, `SLOT : 0 (degraded)`, and no registry path. Outside a git repo the mechanism costs nothing and falls back to plain single-stack behavior. Same result if the registry is unreadable — it can never block a dev server from starting.

You can also check the child-process cache, which is how test-runner workers inherit the parent's slot:

```bash
(cd /tmp/ok-b && __PORT_SLOT__=7 node "$DEMO" | grep SLOT)
```

```
  SLOT     : 7   (cache)
```

---

## Cleanup

```bash
git worktree remove --force /tmp/ok-b /tmp/ok-c
git branch -D tmp-b tmp-c
git worktree prune
rm -f .git/port-lease-registry.json
```

Verify with `git worktree list` and `git branch --list 'tmp-*'`.

---

## Two findings this procedure surfaced

Worth carrying into the consumer wiring (§8 of the pattern doc lists what's still unwired):

**Width 100 is wrong for this repo.** It's the obvious round number and it collides — `FRONTEND_PORT` 4200 + 1×100 lands exactly on `PREVIEW_PORT` 4300, giving 7 cross-slot collisions across slots 0–7. The demo shows this, then searches upward from a `minWidth` of 50 (headroom for 9 ports) and lands on **51**. Don't eyeball the width; assert it:

```typescript
expect(findPortCollisions(PORT_MAP, { width: 51 }, 8)).toEqual([]);
```

The demo also prints `findDuplicateBases`, which is empty for this map. It would not be for a map where two apps that never run together share a port — those collide inside every slot by construction and are reported separately, not as collisions.

**The twins need their own band or a wider range.** `integration-test-doubles` declares `PORT_RANGE { min: 9010, max: 9020 }` and validates against it. Twin bases are 9013–9018, so any slot ≥ 1 walks straight out of that validated range and `config.ts` will reject it. Either widen the constant or give the twins a second band via `BandOptions.bandOffset`.

Also note `PORT` appears in the demo map only to show the arithmetic. Three apps read a bare `PORT` without sharing a base, so a single global value can only ever be right for one of them — in the real launcher it has to be scoped per child process.

---

_`PORT_MAP` in the demo is a hand-copied snapshot of this repo's real ports, so it will drift the first time a port changes. Once a launcher owns the real map, both this procedure and the demo should import it rather than restate it._
