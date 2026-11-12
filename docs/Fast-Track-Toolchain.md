# Fast-Track Toolchain — Project Brief

> **Status:** draft v0.1 (2026-11-12) — living document. Decisions below are the v1 starting point, not final. Update the Decision Log when something changes; don't silently rewrite history.

## 1. Purpose

A Claude harness (top-level skill + per-item instructions + subagents) that stands up an application's foundations — user management, admin panel, theming, navigation, state, API layer, test scaffolding — so a team skips boilerplate and starts on features on day one.

The harness is **opinionated**. It doesn't offer menus of choices; it applies the house way and documents the escape hatch.

**ok-monorepo is the first source for every building block.** Only when ok-monorepo lacks a piece does the harness reach for a third-party tool or write one — and it records that gap so the piece can move into ok-monorepo for every future app.

## 2. Goals and non-goals (v1)

**Goals**

- One command in Claude Code produces a new, running, full-stack app (NestJS + React) with all v1 toolchain items wired and `npm run check-all` green.
- Each toolchain item set up by its own subagent, so the top-level session stays small.
- Instructions written as plain markdown so other LLMs/tools can follow them by hand (project is open source).
- Gaps found during setup flow back to ok-monorepo as well-formed GitHub issues.

**Non-goals for v1** (see §9 for the post-v1 list)

- Brownfield: adding/reorganising toolchain items in an existing app.
- Frontend-only or backend-only apps.
- Multi-tenancy, SSO/SAML, MFA, realtime, Postgres, CI/deploy, i18n.

## 3. Principles

1. **Resolution order for any building block:** (a) existing ok-monorepo library → (b) third-party package, human-approved → (c) write it in the app and file an upstream issue. Never skip (a).
2. **Compose, don't regenerate.** Follow `.claude/rules/code-generation.md` "What NOT to Generate".
3. **Opinionated defaults, documented exceptions.** Every exception is recorded in the generated app's `docs/toolchain-exceptions.md` and becomes an upstream candidate.
4. **e2e over unit.** Playwright covers every happy path the scaffold creates; unit tests only where e2e is a poor fit (§6.7).
5. **Small sessions.** The orchestrator holds the plan and results; subagents hold the file churn.
6. **Every item leaves the app working.** Green `check-all` + one conventional commit per item.

## 4. Decision log (v1)

| #   | Topic               | Decision                                                                                                                                                                    | Revisit                                                                                             |
| --- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| D1  | Output target       | New **standalone repo** (Nx workspace) consuming published `@open-kingdom/*` packages                                                                                       | —                                                                                                   |
| D2  | App shape           | Full-stack only (NestJS + React)                                                                                                                                            | Post-v1: evaluate Angular — its opinionated structure may suit LLM development better               |
| D3  | Runtime             | Claude Code first; instructions portable to other LLMs                                                                                                                      | —                                                                                                   |
| D4  | Harness location    | Lives in ok-monorepo so harness version tracks library versions                                                                                                             | —                                                                                                   |
| D5  | Interaction         | Short intake → unattended run → one review checkpoint at end                                                                                                                | —                                                                                                   |
| D6  | Orchestration       | Sequential by default; items proven independent may run in parallel. Intake asks how many agents are allowed (default: as many as possible)                                 | —                                                                                                   |
| D7  | Definition of done  | Each item: `npm run check-all` green + one conventional commit                                                                                                              | —                                                                                                   |
| D8  | Scope               | Greenfield only                                                                                                                                                             | Post-v1: brownfield implementation/reorganisation                                                   |
| D9  | Gaps                | Build in app, file upstream GitHub issue; human approves any new third-party dependency. Dedupe against open issues first; capped per run (D21)                             | Tune caps after first runs                                                                          |
| D10 | Auth methods        | Email/password + Google, invite-only, password reset                                                                                                                        | Post-v1: SSO/SAML, MFA, magic links, self-registration                                              |
| D11 | Authorization       | Permission-based on `util-rbac`, `admin`/`user` roles seeded. Single tenant                                                                                                 | Post-v1: multi-tenancy                                                                              |
| D12 | Admin panel         | Users list, invite, assign role, deactivate, activity log                                                                                                                   | —                                                                                                   |
| D13 | Session             | **Hybrid:** short-lived access JWT in memory (Bearer) + rotating refresh token in httpOnly cookie                                                                           | Needs a larger discussion later: stronger option (BFF/server sessions) and client-chosen hosted IdP |
| D14 | Component library   | ShadCN-style components in shared `ui-primitives`, themed via CSS variables. An app may vendor a single component only as a documented exception (→ upstream candidate)     | —                                                                                                   |
| D15 | Tailwind            | Upgrade ok-monorepo to Tailwind 4 as a separate step before theming                                                                                                         | —                                                                                                   |
| D16 | Theme               | Light / dark / system, brand palette from intake                                                                                                                            | —                                                                                                   |
| D17 | Navigation          | React Router **data-mode SPA**, sidebar + top bar shell, **one route config** drives routes, menu, guards, breadcrumbs                                                      | Post-v1: framework mode/SSR for customer-facing apps; top-nav shell variant                         |
| D18 | API layer           | REST + OpenAPI → RTK Query codegen only                                                                                                                                     | Realtime needed soon after v1 (§8)                                                                  |
| D19 | State management    | Server state → RTK Query. Redux slices → cross-cutting client state only (auth, preferences, notifications). URL → filters/sort/pagination. Local state → forms, UI toggles | Detailed RTK discussion still pending (§8)                                                          |
| D20 | Database            | SQLite + Drizzle                                                                                                                                                            | Postgres option before production use                                                               |
| D21 | Issue format & caps | GitHub issue template `.github/ISSUE_TEMPLATE/toolchain-gap.md` (six sections). Starting caps: **≤3 new issues and ≤5 comments per run**, configurable                      | Caps are a guess — adjust from real runs                                                            |
| D22 | Tests               | e2e (Playwright, twins only) covers every scaffolded happy path. Unit tests only for logic e2e covers poorly. No coverage thresholds yet                                    | —                                                                                                   |
| D23 | Cross-cutting in v1 | Structured logging, toasts, error boundary/autologger, env config, WCAG AA baseline (a11y is a quality bar on every item, not its own item)                                 | —                                                                                                   |
| D24 | Target apps         | Mostly internal-to-customer business apps; some customer-facing                                                                                                             | Drives post-v1 priority of SSR/framework mode                                                       |

## 5. Harness design

### 5.1 Shape

```
Top-level skill (orchestrator)
 ├─ intake: app name, domain, brand color, roles, agent budget
 ├─ plan: ordered list of toolchain items + which may run in parallel
 ├─ for each item → spawn subagent with that item's instruction file
 │     subagent: read instructions → reuse ok-monorepo → implement → check-all → commit → report
 ├─ collect reports; file/dedupe upstream issues (within caps)
 └─ final checkpoint: summary of what was set up, exceptions, issues filed
```

### 5.2 Draft layout (inside ok-monorepo — names are placeholders)

```
tools/fast-track/
├── README.md                       # human + other-LLM entry point (portable)
├── .claude-plugin/plugin.json      # Claude Code plugin manifest
├── skills/fast-track/SKILL.md      # orchestrator
├── agents/toolchain-item.md        # generic subagent definition
└── items/                          # one instruction file per toolchain item
    ├── 00-bootstrap.md
    ├── 10-api-layer.md
    ├── 20-state.md
    ├── 30-user-management.md
    ├── 40-theming.md
    ├── 50-navigation.md
    ├── 60-unit-tests.md
    └── 70-e2e.md
```

### 5.3 Item instruction file contract

Every `items/*.md` uses the same sections so any LLM can execute it:

1. **Purpose** — one paragraph.
2. **Inputs** — intake values and outputs from earlier items it depends on.
3. **Uses from ok-monorepo** — exact packages and exports. Required, not suggested.
4. **Steps** — ordered, concrete.
5. **Rules** — MUST / NEVER list (the opinions).
6. **Done when** — checks that must pass, e2e happy paths that must exist.
7. **Gap handling** — known gaps and what to do (build locally + issue).
8. **Depends on / parallel-safe with** — for the orchestrator's scheduling.

### 5.4 Orchestration rules

- **Agent budget:** intake asks how many concurrent agents are allowed; default = as many as possible.
- **Parallelism:** only items whose `parallel-safe with` lists each other, each in its own git worktree, merged in plan order. Sequential is the fallback whenever unsure. Most items touch the same files (`AppModule`, store, routes, layout), so expect the spine to be sequential; candidates to verify: theming ∥ API layer, unit-test ∥ e2e authoring.
- **Failure:** a subagent that can't get `check-all` green stops and reports; orchestrator does not continue past a broken item.
- **Reports:** each subagent returns: files changed, ok-monorepo pieces used, exceptions taken, gaps found (as draft issue text), commit SHA.

### 5.5 Upstream issue flow

1. Subagent drafts gap in the six-section format.
2. Orchestrator searches open ok-monorepo issues; if a match exists → comment on it (counts toward comment cap) instead of opening a new one.
3. Over the cap → write remaining drafts to the app's `docs/toolchain-gaps.md` for a human to file.
4. Every automated issue/comment carries the attribution footer from the template.

## 6. Toolchain items (v1)

Each section: what exists in ok-monorepo today, v1 scope, prerequisites, and the happy paths e2e must cover.

### 6.0 Bootstrap

- **Exists:** Nx conventions (`.claude/rules/nx-conventions.md`), `demo-scaffold` + `demo-scaffold-backend` + `demo-scaffold-e2e` as reference apps, `util-port-lease`, `util-env-config`, `util-logging`.
- **v1:** new Nx workspace, frontend app (React 19 + Vite), backend app (NestJS 11), e2e app, root npm scripts mirroring ok-monorepo (`dev`, `check-all`, `db:*`, `swagger:*`, `client:*`), `.claude/` rules carried over, logging + env config wired.
- **Prereq:** confirm every library the harness needs is actually **published to npm** (standalone repos can't use workspace paths).

### 6.1 API layer

- **Exists:** `data-access-api-client` (`baseApi`, auth slice), OpenAPI → RTK Query codegen plugin, `feature-error-autologger`.
- **v1:** `baseApi` wired; codegen scripts working end-to-end in the new repo; global `ValidationPipe`; error autologger middleware; 401 → refresh → retry (for D13).
- **Rule:** never a second `createApi()` for the backend; generated hooks only.
- **Realtime constraint:** don't block it — keep the auth token usable for a socket/SSE handshake, and keep server-pushed updates flowing into the RTK Query cache (`onCacheEntryAdded`) rather than a parallel store.

### 6.2 State management

- **Exists:** root-store composition pattern (`demo-scaffold` `store.config.ts`), `*Key` constant convention, logger + notifications slices.
- **v1:** root store with api, auth, logger, notifications; written guidance (D19) in the generated app's `.claude/rules/` so feature work follows it.
- **Pending:** the detailed RTK discussion (§8) may refine D19 before this item is finalised.

### 6.3 User management & admin panel

- **Exists:** `feature-authentication` (JWT, `@Public()`, `JwtAuthGuard`), `data-access-users`, `feature-user-management` (backend + frontend, invitations), `util-rbac`, `data-access-activity-log`, Google auth emulator (twin).
- **v1:** login/logout, Google login, invite → accept, password reset, `admin`/`user` roles with permissions, admin panel (D12), seed first admin.
- **Prereqs in ok-monorepo:** hybrid session (D13) — refresh endpoint, refresh-token storage/rotation, httpOnly cookie + CSRF protection, `baseApi` refresh-on-401; password reset if not already present; verify whether login currently survives a page refresh.
- **e2e:** login/logout; invite → accept → first login; admin assigns role; deactivated user is blocked; non-admin redirected from admin pages; password reset.

### 6.4 Theming

- **Exists:** `ui-theme` (`tokens.css` CSS variables, Tailwind preset, `cn()`, color mode), `ui-primitives` (ShadCN-style: Radix + `cva`).
- **v1:** light/dark/system; brand palette from intake mapped to CSS variables; all UI from `ui-primitives`.
- **Prereq:** Tailwind 4 upgrade (D15); add "system" mode if `color-mode.ts` lacks it.
- **Rule:** semantic tokens only, no hex; vendoring a component = documented exception (D14).
- **e2e:** toggle theme, reload, theme persists; system mode follows OS preference.

### 6.5 Navigation

- **Exists:** `react-router` 7 with `createBrowserRouter`; `demo-scaffold` `app-layout.tsx`/`app-nav.tsx` (hand-written routes + separate nav).
- **v1:** one route config (`{ path, label, icon, permission, children }`) generating routes, sidebar menu, permission guards, breadcrumbs; sidebar + top bar shell (user menu, theme toggle).
- **Prereq / likely gap:** route-config + app-shell library in ok-monorepo (e.g. `shared-frontend-feature-app-shell`) — today this lives only in the demo app.
- **Rule:** frontend guards are UX only; the backend `util-rbac` check is the real one.
- **e2e:** every menu item reachable for its role; hidden items absent; direct URL to forbidden route redirects; breadcrumbs match path.

### 6.6 Unit test scaffolding

- **Exists:** Jest (backend), Vitest + RTL (frontend), test examples across libs.
- **v1:** config + setup ready; sample tests only for logic e2e covers poorly: RBAC resolver/guards, reducers/selectors, pure utilities.
- **Rule:** feature agents add unit tests only for that kind of logic.

### 6.7 e2e scaffolding

- **Exists:** `demo-scaffold-e2e` (Playwright, `byTestId`), integration test doubles / twins, port leasing.
- **v1:** Playwright project running against twins only (no real external services); all happy paths listed in §6.3–6.5; fixtures for logged-in admin/user.
- **Rule:** every later feature adds e2e for its own happy paths. e2e is preferred over unit.

## 7. Research tasks (for the next developer)

1. **Requirements listing.** Compile feature + technical requirements for the starter kit, split by internal vs customer-facing apps (D24). Start from §4 and §9; output a checklist each toolchain item can be traced against.
2. **Starter-kit research.** We've already found no kit fits wholesale. Goal is **borrowing ideas and pieces**: for each candidate (e.g. shadcn-admin, Refine, react-admin, bulletproof-react, brocoders nestjs-boilerplate, create-t3-app, plus ones already reviewed), note which parts are worth adapting into ok-monorepo and **the license** (permissive = may adapt with attribution; copyleft = ideas only).
3. **Angular evaluation** (post-v1): would Angular's opinionated structure produce better LLM-generated apps?

## 8. Open discussions

| Topic          | Question                                                                                                                                                                                                                                                  |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RTK usage      | Detailed rules for what goes in Redux vs local vs URL vs RTK Query; persistence; selector patterns. Must happen before item 6.2 is finalised                                                                                                              |
| Auth / session | Larger discussion: stronger option than hybrid (BFF/server sessions), and plugging in a client-chosen hosted IdP (Auth0, Keycloak, Entra ID, …)                                                                                                           |
| Realtime       | Client-dependent. One project used SSE but removed it for privacy concerns, replacing it with iframes using access-restricted parent/child messaging. Need a pattern menu (WebSocket gateway, SSE, postMessage/iframe) with privacy criteria for choosing |
| Issue caps     | Are 3 issues / 5 comments per run right?                                                                                                                                                                                                                  |
| Parallel items | Which items are actually independent (§5.4)?                                                                                                                                                                                                              |

## 9. Post-v1 roadmap (known)

Brownfield mode · multi-tenancy · SSO/SAML, MFA, magic links, self-registration · hosted IdP support · realtime · Postgres · CI pipeline · Docker/deploy (GCP?) · i18n · forms library · feature flags · analytics · framework mode/SSR + top-nav shell for customer-facing apps · frontend-only/backend-only modes · Angular evaluation.

## 10. Getting started (suggested order)

1. Do research task 1 (requirements) — lightweight; it validates §4.
2. Land the ok-monorepo prerequisites: publish check (6.0), Tailwind 4 (D15), hybrid session (D13), app-shell/route-config library (6.5). Each is a normal ok-monorepo PR.
3. Write `items/00-bootstrap.md` and the orchestrator skill; get bootstrap alone producing a green repo.
4. Add items one at a time in §6 order, running the harness end-to-end after each.
5. Hold the RTK discussion before 6.2; hold the auth discussion before post-v1 auth work.

### Starter prompts

**Orchestrator skill**

> Read `docs/Fast-Track-Toolchain.md` and `.claude/rules/*`. Create the Claude Code plugin skeleton at `tools/fast-track/` per §5.2 and the orchestrator `SKILL.md` per §5.1 and §5.4: intake (app name, domain, brand color, roles, agent budget defaulting to max), plan, one subagent per item file, stop on red `check-all`, upstream issue flow per §5.5. Also write `tools/fast-track/README.md` so a non-Claude LLM can follow the same process by hand. Don't write item files yet beyond `00-bootstrap.md`.

**One item file**

> Read `docs/Fast-Track-Toolchain.md` §5.3 and §6.<n>. Survey the ok-monorepo libraries listed under "Exists" and read their public exports. Write `tools/fast-track/items/<file>.md` following the §5.3 contract exactly. Name real packages and exports, list MUST/NEVER rules, list the e2e happy paths from §6.<n> under "Done when". Note any gap you find as a draft issue using `.github/ISSUE_TEMPLATE/toolchain-gap.md`.
