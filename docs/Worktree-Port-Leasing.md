# Worktree Port Leasing

Moved. This pattern doc now ships inside the library it documents, so npm
consumers get it in the package tarball alongside the code that cites it:

**[`libs/shared/backend/util-port-lease/docs/Worktree-Port-Leasing.md`](../libs/shared/backend/util-port-lease/docs/Worktree-Port-Leasing.md)**

The manual verification procedure stays here, in
[`Worktree-Port-Leasing-Manual-Test.md`](./Worktree-Port-Leasing-Manual-Test.md) —
it exercises this repo's real ports and is not consumer documentation.

## Adoption in this workspace

The library is the mechanism only. This workspace's own dev stack is **not yet
wired** to it: `npm run dev`, the Nx target env files, and the Playwright/Jest
e2e configs still use fixed ports. Adopting it here means enumerating the ports
the stack binds, picking a width, and wiring those consumers to `leaseSlot()` —
§7 steps 1-3 and 6 of the pattern doc — auditing every derived URL on the way,
per its slot ≠ 0 warning in §5.

The demo app shows what a lease would hand the current worktree at
`/port-lease-demo` (backend: `GET /api/port-lease/status`).
