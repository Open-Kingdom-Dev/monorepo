# Fast-Track RTK — Discussion Summary

Agreed 2026-11-20. Summary of the [discussion brief](Fast-Track-RTK-Discussion.md) and the decisions reached; implementation remains separate.

| Question / ideas explored | Selection | Reason |
| --- | --- | --- |
| RTK Query vs. openapi-react-query / TanStack Query | Keep RTK Query for v1. | Preserve existing integration; to avoid rewrite of exisiting work in ok-monorepo. Redux plus TanStack Query would not inherently create two server-data caches. |
| Where state belongs (D19) | Server data → RTK Query; shared, lasting client state → Redux; shareable view state → URL; temporary UI state → local React state. | Clear ownership avoids duplicate data and unnecessary global state. |
| Explicit reducer registration vs. feature injection | Each app explicitly registers exported feature slices. Injection can be introduced later. | Visible composition, predictable startup, and straightforward typing outweigh small central edits for v1. See the comparison below. |
| Table state ownership | Filters, sort, pagination → URL; column layout → `localStorage`, scoped by app/account/table; temporary selection → local state. Remove the table-owned Redux slice. | Preserve shareable views and personal layouts without putting screen state in Redux. |
| One table library vs. two | TanStack Table is the default; retain AG Grid for justified richer grid workflows. Keep distinct wrappers. | Shared-library needs are uncertain. TanStack supports inline editing and grouping, but requires more interaction code; AG Grid can reduce work for intensive editing. Some advanced features require Enterprise licensing. |
| Redux logs vs. an external buffer | Keep the latest 200 entries in Redux, with unique IDs and no persistence. | Bound growth while retaining the existing debug-panel approach; external buffering can wait. |
| Hybrid auth vs. cookie authentication | Server-set httpOnly cookies authenticate API requests; frontend code never reads or stores auth tokens. This amends D13. | Keep credentials out of JavaScript-accessible state. Account data belongs in RTK Query; cookie settings and CSRF protection must be designed with deployment. |
| Cross-tab logout now vs. later | Include it in v1: broadcast logout, clear each tab's API cache, and show the signed-out screen. | Prevent stale account data remaining visible in other tabs. The server invalidates the session and expires the cookie. |
| Local field state vs. form library vs. Redux forms | React Hook Form + Zod for validated forms; simple standalone controls may use `useState`. | Standardize validation and submission behavior while keeping unsaved input local. |
| Persistence scope / redux-persist | Persist only authentication through cookies, theme and column layouts through `localStorage`, and view state through URLs. No `redux-persist`. | A small allowlist avoids stale or accidental persistence. Logs, notifications, drafts, selection, and API cache are transient by default. |
| Generated tags vs. handwritten enhancements | Handwritten `enhanceEndpoints` rules in `api-enhancements.ts`, organized by endpoint group; entity and `LIST` tags. | Keep generated files untouched and make invalidation reflect domain behavior, including list membership, ordering, and totals. |
| Optimistic vs. server-confirmed changes | Wait for the server by default; allow low-risk, reversible toggles/reorders with failure recovery. Cell drafts may display locally while saving. | Avoid misleading shared state and complex rollback for consequential changes. |
| Focus/reconnect refetching vs. polling | Refetch on focus and reconnect; polling is opt-in per endpoint. | Recover freshness without continuous requests everywhere. |
| Realtime cache vs. separate store | Push events update RTK Query caches or invalidate tags when details are insufficient. Connection status may be separate. | Maintain one owner for server records regardless of transport. |
| MSW now vs. later | Defer MSW for v1. Unit-test reducers, selectors, and custom cache/auth logic; use E2E against twins for boundaries and visible workflows. | Avoid adding a mocking layer before a concrete component-testing need arises. |

## Why explicit reducer registration for v1

Feature libraries export their slices; each app imports and registers the slices it needs. Shared store infrastructure should accept that composition rather than require edits to a fixed shared store library for every feature.

| Concern | Explicit registration: benefit / cost | Feature injection: benefit / cost |
| --- | --- | --- |
| Visibility and ownership | One app-owned list shows the installed reducers and makes feature inclusion reviewable. Every new slice needs an entry. | Registration stays with the feature, but understanding the full store requires following feature imports and registration calls. |
| Startup and debugging | Registered reducers are available from startup; components, listeners, and tests do not need to establish injection order. | Reducers can arrive with features, but registration must run before code relies on them; a missed import can become a runtime issue. |
| TypeScript | Root state is inferred directly from the registered reducers. | Lazy-loaded state needs additional typing conventions, such as declarations and injection-aware selectors. |
| Parallel feature work | Central edits are small, but agents can conflict on the registration list or forget the wiring step. | Agents can keep registration changes within their feature modules, reducing central edits; the app still needs to load those modules. |
| Loading cost | Reducer code loads upfront, even if its feature UI is loaded later. | Reducer code can load alongside a feature, reducing initial code when those reducers are substantial. |
| Multiple consuming apps | Each app explicitly chooses its slices; feature libraries need no dependency on a shared injection registry. | Self-registering features need a defined registry or registration interface that works across consuming apps. |

**Why this balance fits v1:** D19 puts server data in RTK Query, view state in URLs, and temporary input in local state. We therefore expect relatively few feature slices, making explicit wiring a modest cost. Avoiding central edits remains a valid advantage of injection, but we have not established a need that outweighs its registration and typing conventions.

**When to reconsider:** repeated registration conflicts, a plugin model that installs features at runtime, or measured initial-loading costs from substantial feature reducers. Lazy-loaded routes alone do not require lazy-loaded reducers. We can use `combineSlices` with an explicit list now and introduce injection later; this decision sets the registration policy, not a permanent API restriction.

## Why cookie authentication for browser apps

**Selection:** the server sets httpOnly cookies that authenticate API requests directly. The frontend never reads or stores authentication tokens. This replaces D13's hybrid proposal: an access token in memory plus a refresh token in an httpOnly cookie.

| Concern | Cookie authentication: benefit / cost | Hybrid model: benefit / cost |
| --- | --- | --- |
| Credential exposure | httpOnly prevents JavaScript from reading the credential, reducing token theft through injected scripts. Injected scripts can still perform authenticated actions. | JavaScript must handle the access token, so injected scripts can potentially steal it; memory-only storage limits persistence, while the refresh cookie remains unreadable. |
| Frontend responsibilities | Browser sends eligible cookies; no bearer-token storage or Authorization-header wiring. Expiry, refresh if used, and signed-out behavior still need handling. | Frontend manages access-token lifecycle, request headers, and refresh coordination. Explicit bearer headers suit clients that need direct token access. |
| CSRF | Automatic credential sending requires deliberate CSRF defenses for state-changing requests. | A manually attached bearer header reduces classic CSRF exposure for those endpoints; cookie-authenticated refresh and other endpoints still need protection. |
| Hosting | Straightforward when the app and API can use same-origin hosting. Cross-origin requests require credential/CORS configuration; cross-site deployments also face SameSite and third-party-cookie restrictions. | Bearer requests are less dependent on cookie delivery, but the refresh-cookie flow still has cookie constraints. |
| Reload and UI state | Fetch `/me` to establish the current account; the browser retains the cookie according to its lifetime. | Restore an in-memory access token through refresh, then fetch `/me`. |
| Logout and revocation | Server expires cookies and invalidates the session as supported by the backend design. Tabs must also clear visible cached data. | Frontend drops its access token; server handles refresh-session invalidation. Already issued access tokens may remain valid until expiry unless revocation is implemented. |

These security tradeoffs follow [OWASP session guidance](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) and [CSRF guidance](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html). Cross-origin credential requirements are described in [MDN's Fetch guide](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#including_credentials).

**Why this balance fits:** for browser apps calling our backend, keeping credentials outside JavaScript-accessible state is worth the server and deployment responsibilities. RTK Query owns `/me` and other account data; Redux may hold transient auth UI status, but no credential or duplicate account record. Logout or account changes clear account-specific API caches; logout is broadcast to other tabs.

**Still to specify during implementation:** cookie scope, lifetime, `Secure` and appropriate `SameSite` settings, CSRF defenses, and expiry/refresh behavior. Cookie storage does not decide whether the credential is an opaque session ID or a JWT, nor whether refresh cookies are needed. It also does not make JWT revocation automatic. Non-browser clients can have a separate authentication contract without changing this browser default.

The parent toolchain decision log and implementation follow-ups still need updating; this file records the agreed discussion outcomes only.
