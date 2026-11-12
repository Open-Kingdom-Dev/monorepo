# Fast-Track Toolchain — RTK Discussion Brief

> **Status:** prep for discussion (2026-11-12). Settles decision D19 in [Fast-Track-Toolchain.md](Fast-Track-Toolchain.md) before the state-management item (§6.2) is written. Record outcomes in that doc's decision log, then mark this brief resolved.

## Starting rule (D19, agreed as the baseline)

| State kind                 | Where it goes                 | Examples                                            |
| -------------------------- | ----------------------------- | --------------------------------------------------- |
| Server data                | **RTK Query** cache           | users, records, lookups, anything from our API      |
| Cross-cutting client state | **Redux slice**               | auth session, notifications, user preferences       |
| Shareable view state       | **URL** (search params)       | filters, sort, pagination, selected tab             |
| Local UI state             | **`useState` / `useReducer`** | open/closed, hover, wizard step, unsaved form input |

Test for a slice: _will more than one distant component read or write it, and does it outlive the component that created it?_ If not, it's local.

## Where ok-monorepo is today

- RTK 2.11, react-redux 9. `react-hook-form` and `zod` are installed. No redux-persist, no MSW.
- Root store (`libs/demo-scaffold/frontend/feature-root-store`): `logger`, `notifications`, `api`, `auth`, `catFactsApi` reducers, plus auth hydration/listener, logger, and RTK error-autologger middleware. `createRootStore()` takes no arguments, so a feature lib can't add its reducer without editing the store lib.
- Auth persists through `storagePersistence(localStorage)` (in `apps/demo-scaffold/app/store.config.ts`).
- `ui-datagrid` exports its own Redux slice (`DataGridKey`), but nothing registers it in the root store. That's also a `ui-*` lib owning Redux, which breaks our boundary rule. `ui-data-table` keeps the same kind of state in `localStorage` instead.
- The logger slice keeps every log entry forever (no cap), and uses `Date.now()` as the id, which can collide.
- Theme mode lives in `localStorage` (`ui-theme`), not Redux.

## Questions to settle

Each has options and a lean. The lean is a starting point, not a verdict.

### 1. How do feature libraries add their reducers?

| Option                                                                    | Pros                                                                  | Cons                                                       |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------- |
| App owns `configureStore` and imports each slice (today, via a fixed lib) | Explicit, easy to read                                                | Every new feature edits the store. Agents must remember to |
| RTK 2 `combineSlices` + `slice.injectInto` / `withLazyLoadedSlices`       | Features register themselves, slices can lazy-load with routes, typed | Newer API, fewer examples for LLMs to copy                 |

**Lean:** `combineSlices` with injection. It lets one toolchain agent add a feature without touching the store file, which matters for parallel agents.

### 2. Grid/table state (columns, sort, filters)

| Option         | Good for                                              | Cons                                                           |
| -------------- | ----------------------------------------------------- | -------------------------------------------------------------- |
| Redux slice    | Cross-component reads                                 | Lost on reload unless persisted. A `ui-*` lib shouldn't own it |
| URL            | Filters/sort/page: shareable links, back button works | Long URLs, not for column layout                               |
| `localStorage` | Column order/width/visibility (a personal preference) | Per device                                                     |

**Lean:** split it. Filters/sort/page go in the URL, column layout goes in `localStorage`, and Redux holds none of it. Remove the slice from `ui-datagrid`, and decide whether we need two table libs (AG Grid `ui-datagrid` and TanStack `ui-data-table`) or pick one as the default.

### 3. Client logs in Redux

| Option                                               | Pros                                                 | Cons                                                 |
| ---------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------- |
| Keep in Redux (today)                                | Visible in devtools, easy to read from a debug panel | Grows forever, fills devtools/time-travel with noise |
| Capped ring buffer in Redux                          | Keeps the upsides                                    | Still in every state snapshot                        |
| Outside the store (module buffer + flush to backend) | Store stays lean                                     | Debug UI needs its own hook                          |

**Lean:** cap it now (e.g. the last 200 entries, with a proper id). Discuss moving logs out of the store later.

### 4. Auth session in the store, given the hybrid session (D13)

- Access token: in memory only (Redux, not persisted). Refresh cookie: httpOnly, never visible to JS.
- On load: call refresh → `/me` to rehydrate. Drop `localStorage` persistence of the token.
- Cross-tab: logout in one tab logs out the others (`BroadcastChannel`). In or out for v1?

**Lean:** as above, with cross-tab logout in v1 (it's small).

### 5. Forms

| Option                                     | Pros                                                                   | Cons                                                |
| ------------------------------------------ | ---------------------------------------------------------------------- | --------------------------------------------------- |
| `useState` per field                       | Nothing to learn                                                       | Validation and dirty-state code repeated everywhere |
| `react-hook-form` + `zod` (both installed) | Validation schema shared with types, few re-renders, LLMs know it well | One more pattern to learn                           |
| Form state in Redux                        | Survives navigation                                                    | Almost never worth it                               |

**Lean:** `react-hook-form` + `zod` as the house form pattern. "Forms library" was on the post-v1 list, but both are already installed and admin forms (invite, role) need it in v1.

### 6. What persists across reload?

**Lean:** theme and table layouts persist (`localStorage`). The session persists through the refresh cookie. Filters persist through the URL. Nothing else does. No redux-persist.

### 7. RTK Query conventions

- Tag naming (`'User'`, `{ type: 'User', id }`, `'LIST'`) and who invalidates what.
- Optimistic updates (`onQueryStarted`) only for toggles and reorders. Everything else waits for the server.
- Polling vs. refetch-on-focus defaults.
- Do generated endpoints get tags automatically (codegen config), or are they added by hand with `enhanceEndpoints`? (`api-enhancements.ts` exists.)

**Lean:** set tags centrally in `api-enhancements.ts` per generated endpoint group, and keep refetch-on-focus on.

### 8. Realtime (post-v1, but shapes v1)

Pushed updates should write into the RTK Query cache (`onCacheEntryAdded` / `updateQueryData`), whatever the transport (WebSocket, SSE, iframe `postMessage`). The rule is: no parallel store for realtime data. Agree?

### 9. Testing state

- Reducers and selectors: unit tests (per the agreed split).
- RTK Query: covered by e2e against twins. Do we want MSW for component tests, or skip it?

**Lean:** skip MSW in v1. e2e covers the API paths.

## Outcome checklist

- [ ] D19 confirmed or amended
- [ ] Store composition approach chosen (Q1)
- [ ] Grid state + one-vs-two table libs decided (Q2) → ok-monorepo issue if the slice gets removed
- [ ] Logger cap (Q3) → ok-monorepo issue
- [ ] Auth store shape + cross-tab (Q4)
- [ ] Form pattern (Q5)
- [ ] Persistence list (Q6)
- [ ] RTK Query conventions (Q7)
- [ ] Realtime rule (Q8)
- [ ] MSW yes/no (Q9)
