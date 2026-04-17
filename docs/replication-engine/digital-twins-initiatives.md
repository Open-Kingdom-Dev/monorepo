# Integration Test Doubles — Design Specification

## 1. Overview

### Context

This library will be developed in a shared organization monorepo as a standalone, open-source package. Once complete, it will be consumed as a dependency by downstream projects — including the project that motivated its design. The implementation details below are intentionally specific enough to serve as an exact drop-in for that first consumer, but the library itself is project-agnostic.

### Problem

Applications that integrate with third-party services — Spotify, Google Calendar, Google Cloud Storage, YouTube, Gmail/Google Workspace, and Google Auth — lack test doubles with sufficient fidelity for end-to-end testing. This forces feature development against live production APIs and blocks meaningful automated test coverage for any application consuming these services.

### Solution

A network-level interception layer and a suite of local "digital twin" servers that implement the relevant subset of each third-party API. When activated, outbound requests are rerouted to local twins transparently. Application code is never modified — integration code makes real HTTP calls with real auth headers and real serialization; they just land on a different server. Each twin includes enough fidelity to exercise full feature paths, including real audio/video playback using local sample media files.

### Design Principles

* **Zero application code changes.** All routing happens at the network layer. Application code is unaware of the substitution.
* **Realistic playback.** Spotify and YouTube twins render actual media through HTML5 `<audio>` and `<video>` elements using local sample files, while displaying real metadata (track title, artist, video title, channel) from simulated API responses.
* **Single routing table per app.** One declarative configuration maps third-party hostnames to local twin addresses. Easy to audit, easy to extend.
* **Error simulation built in.** Every twin supports configurable failure modes (expired tokens, rate limits, revoked access, quota errors) for negative-path testing.
* **Vertical slices.** Each integration is delivered end-to-end: its share of the interception layer, the twin server, browser shims (if applicable), seed data, startup script, env config, and error simulation. No separate "infrastructure" phase — the first twin establishes patterns, subsequent twins extend them.

---

## 2. Architecture

### 2.1 Network Interception Layer

The library provides interception modules for two runtime environments:

| Runtime | Interception Mechanism |
| --- | --- |
| Node.js (server-side) | Global fetch/HTTP agent interceptor installed at startup |
| Browser (client-side) | MSW (Mock Service Worker) with URL rewrite handlers |

Consuming applications activate interception per application boundary. A typical full-stack app might have separate Node.js and browser entry points, each installing the interceptor independently.

**Activation gate:** Configurable environment variable (e.g., `TEST_MODE=true`). The library exports an activation check that consuming apps can wire into their startup.

**Routing table** (shared config, consumed by all interceptors):

```
# OAuth & Auth
accounts.spotify.com       -> localhost:9010
accounts.google.com        -> localhost:9011
oauth2.googleapis.com      -> localhost:9011

# APIs
api.spotify.com            -> localhost:9010
www.googleapis.com         -> localhost:9012
storage.googleapis.com     -> localhost:9013

# CDN / Script Loads
sdk.scdn.co                -> localhost:9010
www.youtube.com            -> localhost:9012
```

Each vertical slice owns adding its entries to this table. The first twin to ship (GCS) establishes the table format and the interceptor module structure. Subsequent twins add rows.

### 2.2 Twin Servers

Each twin is a standalone HTTP server (Express or similar) that implements the subset of the third-party API surface needed by typical integrations. Twins are stateful where the real service is stateful (e.g., Calendar sync tokens, Spotify playback state).

### 2.3 Sample Media Assets

Two local files shared across all twins and test scenarios:

* `test-assets/sample.mp3` — short royalty-free audio clip for Spotify playback
* `test-assets/sample.mp4` — short royalty-free video clip for YouTube playback

These are served by the twin servers and played by the browser-side shims through native HTML5 media elements. Real metadata (track title, artist, video title, channel) is displayed alongside the sample media, so the UI looks realistic while audio/video confirms the playback pipeline is functioning end-to-end.

---

## 3. Per-Integration Breakouts

### 3.1 Spotify Twin

**Port:** 9010

**API endpoints to implement:**

| Endpoint | Purpose |
| --- | --- |
| `POST /api/token` | OAuth token exchange and refresh |
| `GET /v1/me/playlists` | List user playlists |
| `GET /v1/playlists/{id}/tracks` | Get playlist tracks |
| `GET /v1/search` | Search tracks |
| `GET /v1/me/player` | Current playback state |
| `PUT /v1/me/player/play` | Start/resume playback |
| `PUT /v1/me/player/pause` | Pause playback |
| `POST /v1/me/player/next` | Skip to next track |
| `POST /v1/me/player/previous` | Previous track |
| `PUT /v1/me/player/shuffle` | Toggle shuffle |
| `PUT /v1/me/player` | Transfer playback to device |
| `GET /authorize` | OAuth authorization page |

**Browser-side shim (served in place of** `sdk.scdn.co/spotify-player.js`**):**

* Exports `window.Spotify.Player` with the same constructor signature (`name`, `getOAuthToken`, `volume`)
* `connect()` registers a fake device, emits `ready` event with a device ID
* `togglePlay()`, `nextTrack()`, `previousTrack()` update internal state, emit `player_state_changed`
* Renders an HTML5 `<audio>` element playing `sample.mp3`
* Displays real track metadata (title, artist, album art) from the playback state

**Stateful behavior:**

* Token store: tracks issued access/refresh tokens, expiry times, scopes
* Playback state: current track, position, is-playing, shuffle, device list
* Fixture data: seeded playlists and tracks with realistic metadata and album art URLs (served locally)

**Error simulation modes:**

* Expired token (401 on next API call, refresh succeeds)
* Revoked access (401 on refresh, forces re-auth)
* Rate limit (429 with Retry-After header)
* Device not found (404 on playback transfer)

---

### 3.2 Google Calendar Twin

**Port:** 9011 (shares with Google OAuth)

**API endpoints to implement:**

| Endpoint | Purpose |
| --- | --- |
| `POST /oauth2/v4/token` | Token exchange and refresh |
| `GET /calendar/v3/calendars` | List calendars |
| `POST /calendar/v3/calendars` | Create calendar |
| `GET /calendar/v3/calendars/{id}/events` | List events (full sync with `syncToken` support) |
| `GET /calendar/v3/calendars/{id}/events` (with syncToken) | Incremental sync |
| `POST /calendar/v3/calendars/{id}/events/watch` | Register push notification channel |
| `POST /channels/stop` | Unregister watch channel |

**Push notification simulation:**

* When events are modified via a test control endpoint (e.g., `POST /test/calendar/trigger-change`), the twin sends an HTTP POST to the consuming app's webhook URL with the correct `X-Goog-Channel-ID` and `X-Goog-Resource-ID` headers
* This exercises the full sync cycle: webhook received -> incremental sync -> events updated

**Stateful behavior:**

* Calendar store: calendars and events with realistic data (titles, times, attendees, recurrence)
* Sync tokens: issued on full sync, validated on incremental sync, rejectable (to force re-sync)
* Watch channels: tracked with expiry, renewable

**Error simulation modes:**

* Expired sync token (410 Gone, forces full re-sync)
* Revoked calendar access (403)
* Quota exceeded (403 with `rateLimitExceeded` reason)
* Watch channel expired (triggers re-registration flow)

---

### 3.3 Google Cloud Storage Twin

**Port:** 9013

**Implementation:** Use [fake-gcs-server](https://github.com/fsouza/fake-gcs-server) (Docker). The `@google-cloud/storage` SDK natively supports `STORAGE_EMULATOR_HOST` — no network interception layer needed for this integration. Set the env var and the SDK reroutes itself.

**This is the lowest-effort integration and the first vertical slice to deliver.** It establishes the startup script conventions, env config patterns, and seed data approach without requiring any custom server code or interception infrastructure.

**Operations covered:**

* Upload buffers (photos, media) with timestamped paths
* Download files, base64 encode
* Generate signed URLs (v4) with configurable TTL
* List files in bucket
* Delete files
* SHA256 hashing for deduplication

**Seed data:**

* Pre-populated bucket with a handful of sample images
* Empty user-upload bucket (populated by test flows)

**Error simulation:** Supported by fake-gcs-server configuration (bucket not found, quota errors, permission denied).

---

### 3.4 YouTube Twin

**Port:** 9012 (shares with [googleapis.com](http://googleapis.com) routing)

**API endpoints to implement:**

| Endpoint | Purpose |
| --- | --- |
| `GET /youtube/v3/search` | Video search with query, type, maxResults params |

**Browser-side shim (served in place of** `youtube.com/iframe_api`**):**

* Exports `window.YT.Player` with the same constructor signature
* `YT.Player(elementId, { videoId, playerVars, events })` creates an HTML5 `<video>` element playing `sample.mp4` inside the target div
* Implements standard player methods: `playVideo()`, `pauseVideo()`, `seekTo()`, `setVolume()`, `mute()`, `unMute()`, `getPlayerState()`, `getCurrentTime()`, `getDuration()`, `getVolume()`, `isMuted()`
* Fires the same event callbacks: `onReady`, `onStateChange`, `onError`
* Exposes `YT.PlayerState` constants (`PLAYING`, `PAUSED`, `ENDED`, `BUFFERING`)
* Overlays real video metadata (title, channel) from the playback data

**Search fixtures:**

* Canned set of 20+ video results with realistic titles, channels, thumbnails (served locally), and video IDs
* Query-aware: different queries return different subsets for testing search behavior

**Error simulation modes:**

* Quota exceeded (403 `dailyLimitExceeded`)
* Invalid API key (400)
* Empty results (valid response, zero items)
* Player error codes (2, 5, 100, 101, 150 — matching YouTube's real error codes)

---

### 3.5 Google Auth Twin

**Surface area:** Server-side and browser-side OAuth flows.

**Scope:**

* **OAuth redirect handling:** When application code navigates to the Google OAuth authorize URL, the interception layer redirects to a local page that auto-completes the OAuth flow with a configurable test user identity. Establishes the browser OAuth redirect interception pattern reused by Calendar and Spotify.
* **Role coverage:** Support configurable user identities with arbitrary role/permission structures so consuming apps can test their full authorization matrix.
* **Session lifecycle:** Configurable session expiry to test re-auth and token refresh flows.
* **Invitation flow simulation:** Support both "known user signs in" and "unknown user blocked" scenarios without hitting Google.

---

### 3.6 Gmail / Google Workspace Email Twin

**Port:** 9011 (shares with Google OAuth/Calendar googleapis routing)

**API endpoint to implement:**

| Endpoint | Purpose |
| --- | --- |
| `POST /gmail/v1/users/me/messages/send` | Send email |

**Auth handling:**

* Accept JWT auth tokens created using service account credentials
* Validate the JWT structure is present but don't verify the signature — trust that application code is constructing it correctly

**Behavior:**

* Decode the base64url-encoded `raw` field from the request body to extract the MIME email (From, To, Subject, body)
* Store captured emails in an in-memory queue, queryable by recipient address
* Expose a test control endpoint: `GET /test/emails?to={address}` — returns all captured emails for that recipient, most recent first
* Each captured email includes: `to`, `from`, `subject`, `html` or `text` body, `timestamp`
* Return a valid Gmail API response: `{ id: "<generated>", threadId: "<generated>", labelIds: ["SENT"] }`

**E2E test usage pattern:**

1. Test triggers an action that sends an email (e.g., invitation, magic-link sign-in)
2. Application code calls Gmail API -> intercepted -> twin captures the email
3. Test calls `GET /test/emails?to=user@example.com` -> gets the email body
4. Test extracts the link URL from the HTML body
5. Test navigates to that URL to complete the flow

**Error simulation modes:**

* Service account not authorized (403 `insufficientPermissions`)
* Rate limit (429)
* Invalid recipient (400)

---

## 4. Implementation Sequence

Each item is a vertical slice delivering a fully working twin end-to-end: its share of the interception layer, the twin server, browser shims (if applicable), seed data, startup script, env config, and error simulation. The first twin establishes the patterns; subsequent twins extend them.

| Order | Integration | Rationale |
| --- | --- | --- |
| 1 | **GCS** | Off-the-shelf emulator, native SDK support via `STORAGE_EMULATOR_HOST`. Establishes the env-config pattern and startup conventions without needing the interception layer at all. |
| 2 | **Gmail / Google Workspace Email** | Small API surface (one endpoint). First integration to require the network interception layer — establishes the interceptor module pattern for Node.js. Unblocks email-dependent test flows. |
| 3 | **Google Auth** | Extends the interception layer to handle browser OAuth redirects — establishes that pattern for Calendar and Spotify later. |
| 4 | **YouTube** | First integration requiring a browser-side shim (YT.Player). Establishes the CDN script interception + HTML5 media playback pattern that Spotify reuses. Moderate API surface. |
| 5 | **Google Calendar** | Stateful sync tokens and webhook push simulation. No browser shim needed. High value for testing real-time sync pipelines. |
| 6 | **Spotify** | Largest scope. Reuses the OAuth redirect pattern (from Auth), CDN script shim pattern (from YouTube), and media playback pattern (from YouTube). Doing this last means all patterns are proven before tackling the most complex integration. |

‌