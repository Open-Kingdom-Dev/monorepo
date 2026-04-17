# Implementation Guide: Google Calendar Twin

## Summary

This is the fifth vertical slice. It delivers a local twin for the Google Calendar API with full support for stateful sync tokens, incremental sync, and webhook push notification simulation. No browser shim is needed. This twin has the most complex stateful behavior of any slice — sync tokens and watch channels require careful lifecycle management.

---

## 1. Goals

* Implement the Calendar API endpoints needed for full-sync and incremental-sync flows.
* Support push notification simulation: the twin actively POSTs to the consuming app's webhook URL when calendar data changes.
* Maintain realistic stateful behavior: sync tokens, watch channel registration/expiry, and event versioning.
* Enable testing of real-time sync pipelines end-to-end without hitting Google.

---

## 2. Architecture

```
Server:
┌───────────────────┐     ┌──────────────────────┐     ┌────────────────────┐
│ App calls          │────>│  Node Interceptor   │────>│  Calendar Twin     │
│ Calendar API       │     │  (fetch rewrite)    │     │  localhost:9011    │
└───────────────────┘     └──────────────────────┘     └────────┬───────────┘
                                                                │
                                                                │ webhook POST
                                                                ▼
                                                       ┌────────────────────┐
                                                       │ App webhook        │
                                                       │ endpoint           │
                                                       └────────────────────┘
```

### Port Assignment

| Host | Port |
| --- | --- |
| `www.googleapis.com` (Calendar API) | 9011 |

Shares port 9011 with Google Auth and Gmail twins. Routes are disambiguated by path prefix (`/calendar/`).

---

## 3. Directory Structure

```
packages/integration-test-doubles/
  src/
    google-calendar/
      index.ts                      # Public API exports
      calendar-twin.ts              # Twin lifecycle + Express server
      calendar-twin.config.ts       # Configuration
      calendar-store.ts             # In-memory calendar + event store
      sync-token-manager.ts         # Sync token issuance and validation
      watch-channel-manager.ts      # Watch channel registration and notification
      seed-data.ts                  # Default calendars and events
      __tests__/
        calendar-twin.spec.ts
        sync-token-manager.spec.ts
        watch-channel-manager.spec.ts
```

---

## 4. Data Model

### 4.1 Calendar Store

```
// src/google-calendar/calendar-store.ts
export interface CalendarResource {
  id: string;
  summary: string;
  description?: string;
  timeZone: string;
  backgroundColor?: string;
  foregroundColor?: string;
  primary?: boolean;
  accessRole: 'owner' | 'writer' | 'reader' | 'freeBusyReader';
}

export interface EventResource {
  id: string;
  calendarId: string;
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime: string; timeZone?: string } | { date: string };
  end: { dateTime: string; timeZone?: string } | { date: string };
  status: 'confirmed' | 'tentative' | 'cancelled';
  created: string;
  updated: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  }>;
  recurrence?: string[];           // RRULE strings
  recurringEventId?: string;       // For instances of recurring events
  sequence: number;                // Incremented on each update
  etag: string;
}

export class CalendarStore {
  private calendars: Map<string, CalendarResource> = new Map();
  private events: Map<string, EventResource[]> = new Map(); // calendarId -> events

  addCalendar(calendar: CalendarResource): void;
  getCalendar(id: string): CalendarResource | undefined;
  listCalendars(): CalendarResource[];

  addEvent(calendarId: string, event: EventResource): void;
  updateEvent(calendarId: string, eventId: string, updates: Partial<EventResource>): void;
  deleteEvent(calendarId: string, eventId: string): void;
  getEvent(calendarId: string, eventId: string): EventResource | undefined;
  listEvents(calendarId: string): EventResource[];

  /** Get events modified after the given sync snapshot */
  getEventsSince(calendarId: string, snapshotId: string): EventResource[];

  /** Take a snapshot of the current state for sync token generation */
  takeSnapshot(calendarId: string): string;

  clear(): void;
}
```

### 4.2 Event Versioning

Every mutation (add, update, delete) must:

1. Update the `updated` timestamp on the event.
2. Increment the `sequence` number.
3. Generate a new `etag`.
4. For deletions, set `status: 'cancelled'` rather than removing (Google's incremental sync returns cancelled events).

---

## 5. Sync Token Manager

Sync tokens are the core of the Calendar API's change tracking. This component must be implemented with care.

### 5.1 How Google Calendar Sync Works

1. **Full sync:** Client calls `GET /calendar/v3/calendars/{id}/events` without a `syncToken`. Server returns all events and a `nextSyncToken`.
2. **Incremental sync:** Client calls the same endpoint with the `syncToken` from the previous response. Server returns only events that changed since that token was issued.
3. **Token invalidation:** If the server can't honor the sync token (too old, state reset), it returns `410 Gone`, forcing the client to do a full sync.

### 5.2 Implementation

```
// src/google-calendar/sync-token-manager.ts
export class SyncTokenManager {
  private tokens: Map<string, SyncTokenData> = new Map();

  /**
   * Issue a new sync token for a calendar.
   * Internally records a snapshot of the current event state.
   */
  issueToken(calendarId: string, calendarStore: CalendarStore): string;

  /**
   * Validate a sync token. Returns the changed events since issuance,
   * or throws if the token is invalid/expired.
   */
  resolveToken(syncToken: string, calendarStore: CalendarStore): {
    events: EventResource[];
    newSyncToken: string;
  } | { invalid: true };

  /**
   * Invalidate a specific token (for testing 410 flows).
   */
  invalidateToken(syncToken: string): void;

  /**
   * Invalidate all tokens for a calendar.
   */
  invalidateAllTokens(calendarId: string): void;

  clear(): void;
}

interface SyncTokenData {
  token: string;
  calendarId: string;
  snapshotId: string;    // References a CalendarStore snapshot
  issuedAt: Date;
}
```

### 5.3 Token Format

Tokens should be opaque strings: `sync-<calendarId>-<uuid>`. Don't encode state in the token — look it up server-side.

---

## 6. Watch Channel Manager

### 6.1 How Google Push Notifications Work

1. **Register:** Client calls `POST /calendar/v3/calendars/{id}/events/watch` with a webhook URL, channel ID, and expiry.
2. **Notify:** When events change, Google POSTs to the webhook URL with headers:

    * `X-Goog-Channel-ID`: The channel ID provided during registration
    * `X-Goog-Resource-ID`: A server-assigned resource ID
    * `X-Goog-Resource-State`: `sync` (initial) or `exists` (change notification)
    * `X-Goog-Message-Number`: Incrementing message counter
    
3. **Unregister:** Client calls `POST /channels/stop` with the channel ID and resource ID.

### 6.2 Implementation

```
// src/google-calendar/watch-channel-manager.ts
export interface WatchChannel {
  channelId: string;          // Client-provided
  resourceId: string;         // Server-assigned
  calendarId: string;
  webhookUrl: string;
  expiration: Date;
  messageNumber: number;
}

export class WatchChannelManager {
  private channels: Map<string, WatchChannel> = new Map();

  /**
   * Register a new watch channel.
   * Immediately sends a 'sync' notification to confirm the channel.
   */
  async register(params: {
    channelId: string;
    calendarId: string;
    webhookUrl: string;
    ttlMs?: number;
  }): Promise<WatchChannel>;

  /**
   * Unregister a watch channel.
   */
  unregister(channelId: string, resourceId: string): boolean;

  /**
   * Notify all active channels for a calendar that events changed.
   * Sends HTTP POST to each channel's webhook URL.
   */
  async notifyChange(calendarId: string): Promise<void>;

  /**
   * Get all active channels (for debugging/testing).
   */
  getActiveChannels(): WatchChannel[];

  /**
   * Check and remove expired channels.
   */
  pruneExpired(): void;

  clear(): void;
}
```

### 6.3 Notification Delivery

When `notifyChange()` is called, for each active channel watching that calendar:

```
await fetch(channel.webhookUrl, {
  method: 'POST',
  headers: {
    'X-Goog-Channel-ID': channel.channelId,
    'X-Goog-Resource-ID': channel.resourceId,
    'X-Goog-Resource-State': 'exists',
    'X-Goog-Message-Number': String(++channel.messageNumber),
  },
});
```

The POST body is empty (matches real Google behavior).

---

## 7. Calendar Twin Server

### 7.1 Configuration

```
export interface CalendarTwinConfig {
  port: number;
  defaultWebhookTimeout: number;  // Channel TTL in ms (default: 86400000 = 24h)
}

export const defaultCalendarConfig: CalendarTwinConfig = {
  port: 9011,
  defaultWebhookTimeout: 86400000,
};
```

### 7.2 Public API

```
export class GoogleCalendarTwin {
  constructor(config?: Partial<CalendarTwinConfig>);

  async start(): Promise<void>;
  async stop(): Promise<void>;
  async reset(): Promise<void>;
  async isHealthy(): Promise<boolean>;

  getCalendarStore(): CalendarStore;
  getSyncTokenManager(): SyncTokenManager;
  getWatchChannelManager(): WatchChannelManager;
}
```

### 7.3 API Endpoints

#### Calendar API Surface

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/calendar/v3/users/me/calendarList` | List user's calendars |
| `POST` | `/calendar/v3/calendars` | Create a calendar |
| `GET` | `/calendar/v3/calendars/:calendarId/events` | List events (full or incremental sync) |
| `POST` | `/calendar/v3/calendars/:calendarId/events` | Create an event |
| `PUT` | `/calendar/v3/calendars/:calendarId/events/:eventId` | Update an event |
| `DELETE` | `/calendar/v3/calendars/:calendarId/events/:eventId` | Delete an event |
| `POST` | `/calendar/v3/calendars/:calendarId/events/watch` | Register watch channel |
| `POST` | `/channels/stop` | Unregister watch channel |

#### List Events (Full Sync)

`GET /calendar/v3/calendars/:calendarId/events`

Without `syncToken` query parameter:

```
{
  "kind": "calendar#events",
  "etag": "\"cal-etag-123\"",
  "summary": "Work Calendar",
  "updated": "2024-03-15T10:00:00Z",
  "timeZone": "America/New_York",
  "accessRole": "owner",
  "nextSyncToken": "sync-cal123-uuid456",
  "items": [
    {
      "kind": "calendar#event",
      "etag": "\"event-etag-001\"",
      "id": "evt-001",
      "status": "confirmed",
      "summary": "Team Standup",
      "start": { "dateTime": "2024-03-15T09:00:00-04:00", "timeZone": "America/New_York" },
      "end": { "dateTime": "2024-03-15T09:30:00-04:00", "timeZone": "America/New_York" },
      "created": "2024-03-01T12:00:00Z",
      "updated": "2024-03-01T12:00:00Z",
      "sequence": 0
    }
  ]
}
```

#### List Events (Incremental Sync)

`GET /calendar/v3/calendars/:calendarId/events?syncToken=sync-cal123-uuid456`

Returns only changed events since the sync token was issued:

```
{
  "kind": "calendar#events",
  "etag": "\"cal-etag-124\"",
  "updated": "2024-03-15T11:00:00Z",
  "nextSyncToken": "sync-cal123-uuid789",
  "items": [
    {
      "id": "evt-002",
      "status": "confirmed",
      "summary": "New Meeting",
      "start": { "dateTime": "2024-03-16T14:00:00-04:00" },
      "end": { "dateTime": "2024-03-16T15:00:00-04:00" },
      "updated": "2024-03-15T11:00:00Z",
      "sequence": 0
    },
    {
      "id": "evt-001",
      "status": "cancelled",
      "updated": "2024-03-15T10:30:00Z",
      "sequence": 1
    }
  ]
}
```

#### Invalid Sync Token

If the sync token is invalid or expired, return `410 Gone`:

```
{
  "error": {
    "errors": [{ "domain": "calendar", "reason": "fullSyncRequired" }],
    "code": 410,
    "message": "Sync token is no longer valid, a full sync is required."
  }
}
```

#### Watch Registration

`POST /calendar/v3/calendars/:calendarId/events/watch`

Request:

```
{
  "id": "channel-uuid-123",
  "type": "web_hook",
  "address": "https://myapp.example.com/api/calendar/webhook",
  "expiration": 1710600000000
}
```

Response:

```
{
  "kind": "api#channel",
  "id": "channel-uuid-123",
  "resourceId": "resource-uuid-456",
  "resourceUri": "https://www.googleapis.com/calendar/v3/calendars/cal123/events",
  "expiration": 1710600000000
}
```

Immediately after registration, send a `sync` notification to the webhook URL.

#### Test Control API

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/test/calendar/health` | Health check |
| `POST` | `/test/calendar/reset` | Reset all state (calendars, events, tokens, channels) |
| `POST` | `/test/calendar/trigger-change` | Modify events and trigger webhook notifications |
| `GET` | `/test/calendar/channels` | List active watch channels |
| `POST` | `/test/calendar/invalidate-sync-tokens` | Invalidate all sync tokens (force re-sync) |
| `POST` | `/test/calendar/error-mode` | Configure error simulation |
| `DELETE` | `/test/calendar/error-mode` | Clear error simulation |

---

## 8. Trigger Change Endpoint

This is the key endpoint for E2E testing. It allows tests to simulate calendar changes and observe the full sync cycle:

```
POST /test/calendar/trigger-change
{
  "calendarId": "cal-123",
  "changes": [
    {
      "action": "add",
      "event": {
        "summary": "New Appointment",
        "start": { "dateTime": "2024-03-20T10:00:00Z" },
        "end": { "dateTime": "2024-03-20T11:00:00Z" }
      }
    },
    {
      "action": "update",
      "eventId": "evt-001",
      "updates": { "summary": "Updated Meeting Title" }
    },
    {
      "action": "delete",
      "eventId": "evt-002"
    }
  ]
}
```

After applying changes, the twin:

1. Updates the calendar store.
2. Notifies all active watch channels via `WatchChannelManager.notifyChange()`.

The consuming app's webhook handler receives the notification, triggers an incremental sync, and processes the changes — exactly as it would with the real Google Calendar API.

---

## 9. Seed Data

```
// src/google-calendar/seed-data.ts
export const defaultCalendars: CalendarResource[] = [
  {
    id: 'primary',
    summary: 'Primary Calendar',
    timeZone: 'America/New_York',
    primary: true,
    accessRole: 'owner',
  },
  {
    id: 'work',
    summary: 'Work',
    timeZone: 'America/New_York',
    backgroundColor: '#4285f4',
    accessRole: 'owner',
  },
  {
    id: 'shared-team',
    summary: 'Team Calendar',
    timeZone: 'America/New_York',
    backgroundColor: '#0b8043',
    accessRole: 'reader',
  },
];

export const defaultEvents: Record<string, EventResource[]> = {
  primary: [
    {
      id: 'evt-001',
      calendarId: 'primary',
      summary: 'Daily Standup',
      start: { dateTime: '2024-03-15T09:00:00-04:00', timeZone: 'America/New_York' },
      end: { dateTime: '2024-03-15T09:30:00-04:00', timeZone: 'America/New_York' },
      status: 'confirmed',
      created: '2024-03-01T12:00:00Z',
      updated: '2024-03-01T12:00:00Z',
      recurrence: ['RRULE:FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR'],
      sequence: 0,
      etag: '"evt-001-v0"',
    },
    // ... 5-10 more events with variety (all-day, multi-day, with attendees, etc.)
  ],
  work: [
    // ... work calendar events
  ],
};
```

---

## 10. Error Simulation

| Mode | Behavior |
| --- | --- |
| `sync-token-expired` | Next incremental sync returns 410 Gone (forces full re-sync) |
| `calendar-access-revoked` | All Calendar API calls return 403 |
| `quota-exceeded` | All calls return 403 with `rateLimitExceeded` reason |
| `watch-channel-expired` | Next change notification includes expiry, triggers re-registration |
| `webhook-delivery-failure` | Webhook POST to consuming app returns 5xx (tests retry logic) |

---

## 11. Routing Table Updates

```
{ hostname: 'www.googleapis.com', target: 'http://localhost:9011', pathPrefix: '/calendar/' },
```

This entry coexists with the YouTube twin's `pathPrefix: '/youtube/'` on the same hostname.

---

## 12. Testing the Twin

```
describe('GoogleCalendarTwin', () => {
  let twin: GoogleCalendarTwin;

  beforeAll(async () => {
    twin = new GoogleCalendarTwin();
    await twin.start();
  });

  afterAll(async () => {
    await twin.stop();
  });

  beforeEach(async () => {
    await twin.reset();
  });

  describe('Full sync', () => {
    it('should return all events with a nextSyncToken', async () => {
      const res = await fetch('http://localhost:9011/calendar/v3/calendars/primary/events', {
        headers: { 'Authorization': 'Bearer test-token' },
      });
      const data = await res.json();
      expect(data.kind).toBe('calendar#events');
      expect(data.nextSyncToken).toBeDefined();
      expect(data.items.length).toBeGreaterThan(0);
    });
  });

  describe('Incremental sync', () => {
    it('should return only changed events when using syncToken', async () => {
      // Full sync to get initial token
      const fullRes = await fetch('http://localhost:9011/calendar/v3/calendars/primary/events', {
        headers: { 'Authorization': 'Bearer test-token' },
      });
      const fullData = await fullRes.json();
      const syncToken = fullData.nextSyncToken;

      // Make a change
      await fetch('http://localhost:9011/test/calendar/trigger-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calendarId: 'primary',
          changes: [{ action: 'add', event: { summary: 'New Event', start: { dateTime: '2024-03-20T10:00:00Z' }, end: { dateTime: '2024-03-20T11:00:00Z' } } }],
        }),
      });

      // Incremental sync
      const incRes = await fetch(
        `http://localhost:9011/calendar/v3/calendars/primary/events?syncToken=${syncToken}`,
        { headers: { 'Authorization': 'Bearer test-token' } }
      );
      const incData = await incRes.json();
      expect(incData.items).toHaveLength(1);
      expect(incData.items[0].summary).toBe('New Event');
      expect(incData.nextSyncToken).not.toBe(syncToken);
    });

    it('should return 410 for invalid sync token', async () => {
      const res = await fetch(
        'http://localhost:9011/calendar/v3/calendars/primary/events?syncToken=invalid-token',
        { headers: { 'Authorization': 'Bearer test-token' } }
      );
      expect(res.status).toBe(410);
    });
  });

  describe('Watch channels', () => {
    it('should register a watch channel and send sync notification', async () => {
      // Set up a local webhook receiver
      const notifications: any[] = [];
      const webhookServer = createWebhookReceiver(notifications);
      await webhookServer.listen(9199);

      const res = await fetch('http://localhost:9011/calendar/v3/calendars/primary/events/watch', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer test-token', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'test-channel',
          type: 'web_hook',
          address: 'http://localhost:9199/webhook',
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.id).toBe('test-channel');
      expect(data.resourceId).toBeDefined();

      // Should have received a sync notification
      await waitFor(() => expect(notifications).toHaveLength(1));
      expect(notifications[0].headers['x-goog-resource-state']).toBe('sync');

      await webhookServer.close();
    });

    it('should send change notification when events are modified', async () => {
      // Register channel, trigger change, verify notification received
    });

    it('should unregister a watch channel', async () => {
      // Register, unregister, trigger change, verify NO notification
    });
  });

  describe('Error simulation', () => {
    it('should force full re-sync by invalidating sync tokens', async () => {
      // Get token, invalidate, attempt incremental sync, expect 410
    });
  });
});
```

---

## 13. Checklist

* Calendar list endpoint returns seed calendars
* Calendar creation endpoint works
* Full sync returns all events with `nextSyncToken`
* Incremental sync returns only changed events since last sync token
* Deleted events appear with `status: 'cancelled'` in incremental sync
* Invalid/expired sync tokens return 410 Gone
* Watch channel registration works and sends initial `sync` notification
* Watch channel unregistration works
* Event changes trigger webhook notifications to registered channels
* Webhook notifications include correct `X-Goog-*` headers
* `trigger-change` test endpoint applies changes and notifies channels
* Seed data includes realistic calendars and events
* Event versioning (sequence, etag, updated timestamp) works correctly
* Error simulation modes work (sync token expired, access revoked, quota, watch expired)
* `reset()` clears all state and restores seed data
* Routing table updated for `www.googleapis.com/calendar/`
* All twin and component tests pass

‌