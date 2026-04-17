# Implementation Guide: YouTube Twin

## Summary

This is the fourth vertical slice. It delivers a local twin for the YouTube Data API (search) and a browser-side shim that replaces the YouTube IFrame Player API with an HTML5 `<video>` element playing local sample media. This is the **first integration requiring a browser-side CDN script shim**, establishing the pattern that Spotify reuses later.

---

## 1. Goals

* Provide a local YouTube Data API twin that serves canned search results with realistic metadata.
* Replace the YouTube IFrame Player API (`youtube.com/iframe_api`) with a shim that creates real HTML5 `<video>` elements playing local sample media.
* Establish the CDN script interception + HTML5 media playback pattern for later reuse.
* Zero application code changes — the shim has the same API surface as the real YouTube player.

---

## 2. Architecture

```
Browser:
┌───────────────────┐     ┌──────────────────────┐     ┌──────────────────┐
│ App loads          │────>│  MSW / Browser       │────>│  YouTube Twin    │
│ youtube.com/       │     │  Interceptor         │     │  localhost:9012  │
│ iframe_api         │     └──────────────────────┘     │  serves shim.js  │
└───────────────────┘                                   └──────────────────┘
                                                                │
                                                    ┌───────────┘
                                                    ▼
                                         ┌──────────────────────┐
                                         │  YT.Player shim      │
                                         │  HTML5 <video>       │
                                         │  plays sample.mp4    │
                                         └──────────────────────┘

Server:
┌───────────────────┐     ┌──────────────────────┐     ┌──────────────────┐
│ App calls          │────>│  Node Interceptor   │────>│  YouTube Twin    │
│ youtube/v3/search  │     │  (fetch rewrite)    │     │  localhost:9012  │
└───────────────────┘     └──────────────────────┘     └──────────────────┘
```

### Port Assignment

| Host | Port |
| --- | --- |
| `www.googleapis.com` (YouTube Data API) | 9012 |
| `www.youtube.com` (IFrame API script) | 9012 |

---

## 3. Directory Structure

```
packages/integration-test-doubles/
  src/
    youtube/
      index.ts                      # Public API exports
      youtube-twin.ts               # Twin lifecycle + Express server
      youtube-twin.config.ts        # Configuration
      search-fixtures.ts            # Canned search result data
      player-shim.ts                # Generates the browser-side YT.Player shim JS
      __tests__/
        youtube-twin.spec.ts
        player-shim.spec.ts
  test-assets/
    sample.mp4                      # Short royalty-free video (~5-10 seconds)
    thumbnail-01.jpg through
    thumbnail-20.jpg                # Canned video thumbnails
```

---

## 4. CDN Script Interception Pattern (New — Established Here)

### 4.1 Problem

Applications load the YouTube IFrame API via a `<script>` tag:

```
<script src="https://www.youtube.com/iframe_api"></script>
```

This script defines `window.YT` and `window.YT.Player`. The twin must intercept this script load and serve a replacement that implements the same API using local resources.

### 4.2 Solution

The browser interceptor (MSW, established in slice 3) intercepts the request to `www.youtube.com/iframe_api` and returns the shim JavaScript instead.

```
// Added to MSW handlers
http.get('https://www.youtube.com/iframe_api', () => {
  // Fetch the shim JS from the local twin server
  const shimJs = await fetch('http://localhost:9012/shim/youtube-player.js');
  return new HttpResponse(await shimJs.text(), {
    headers: { 'Content-Type': 'application/javascript' },
  });
});
```

Alternatively, the twin can serve the shim directly and the routing table handles it:

```
{ hostname: 'www.youtube.com', target: 'http://localhost:9012' }
```

Then the twin's Express server handles `GET /iframe_api` by serving the shim JS.

### 4.3 Pattern for Later Reuse

This establishes the general pattern for CDN script interception:

1. Add the CDN hostname to the routing table.
2. Twin serves a shim JS file at the same path the real CDN uses.
3. Shim implements the same global API (`window.YT`, `window.Spotify`, etc.).
4. Shim uses HTML5 media elements with local sample files instead of proprietary players.
5. Shim fires the same events and exposes the same methods.

---

## 5. Search Fixtures

### 5.1 Fixture Data

Create a canned set of 20+ video results with realistic metadata:

```
// src/youtube/search-fixtures.ts
export interface VideoFixture {
  videoId: string;
  title: string;
  channelTitle: string;
  channelId: string;
  description: string;
  publishedAt: string;
  thumbnailUrl: string;    // Served locally
  duration: string;        // ISO 8601 duration
  viewCount: string;
  tags: string[];
}

export const videoFixtures: VideoFixture[] = [
  {
    videoId: 'test-vid-001',
    title: 'Morning Yoga Flow - 20 Minutes',
    channelTitle: 'Wellness Daily',
    channelId: 'UC-test-channel-001',
    description: 'Start your day with this gentle 20-minute yoga flow...',
    publishedAt: '2024-03-15T10:00:00Z',
    thumbnailUrl: '/test-assets/thumbnail-01.jpg',
    duration: 'PT20M15S',
    viewCount: '1250000',
    tags: ['yoga', 'morning', 'wellness', 'fitness'],
  },
  // ... 19+ more fixtures with diverse content categories
];
```

### 5.2 Query-Aware Search

Different search queries should return different subsets to test search behavior:

```
export function searchFixtures(query: string, maxResults: number = 10): VideoFixture[] {
  const q = query.toLowerCase();
  const matches = videoFixtures.filter((v) =>
    v.title.toLowerCase().includes(q) ||
    v.tags.some((t) => t.includes(q)) ||
    v.description.toLowerCase().includes(q)
  );
  return matches.slice(0, maxResults);
}
```

If no query matches, return a general subset. Never return zero results unless explicitly configured via error simulation.

---

## 6. YouTube Twin Server

### 6.1 Configuration

```
// src/youtube/youtube-twin.config.ts
export interface YouTubeTwinConfig {
  port: number;
  sampleVideoPath: string;
  thumbnailDir: string;
}

export const defaultYouTubeConfig: YouTubeTwinConfig = {
  port: 9012,
  sampleVideoPath: './test-assets/sample.mp4',
  thumbnailDir: './test-assets/',
};
```

### 6.2 Public API

```
export class YouTubeTwin {
  constructor(config?: Partial<YouTubeTwinConfig>);

  async start(): Promise<void>;
  async stop(): Promise<void>;
  async reset(): Promise<void>;
  async isHealthy(): Promise<boolean>;
}
```

### 6.3 API Endpoints

#### YouTube Data API

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/youtube/v3/search` | Video search |

**Search endpoint:**

Query parameters:

* `q` — search query string
* `type` — resource type (only `video` is needed)
* `maxResults` — max items to return (default 10, max 50)
* `key` — API key (validated for presence, not value)
* `part` — resource parts to include (always return `snippet`)

Response format (matches real YouTube API):

```
{
  "kind": "youtube#searchListResponse",
  "etag": "test-etag",
  "pageInfo": {
    "totalResults": 15,
    "resultsPerPage": 10
  },
  "items": [
    {
      "kind": "youtube#searchResult",
      "etag": "item-etag-001",
      "id": {
        "kind": "youtube#video",
        "videoId": "test-vid-001"
      },
      "snippet": {
        "publishedAt": "2024-03-15T10:00:00Z",
        "channelId": "UC-test-channel-001",
        "title": "Morning Yoga Flow - 20 Minutes",
        "description": "Start your day with this gentle...",
        "thumbnails": {
          "default": { "url": "http://localhost:9012/test-assets/thumbnail-01.jpg", "width": 120, "height": 90 },
          "medium": { "url": "http://localhost:9012/test-assets/thumbnail-01.jpg", "width": 320, "height": 180 },
          "high": { "url": "http://localhost:9012/test-assets/thumbnail-01.jpg", "width": 480, "height": 360 }
        },
        "channelTitle": "Wellness Daily"
      }
    }
  ]
}
```

#### Static Assets

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/test-assets/sample.mp4` | Sample video file |
| `GET` | `/test-assets/thumbnail-*.jpg` | Video thumbnails |
| `GET` | `/iframe_api` | YouTube IFrame API shim (JS) |
| `GET` | `/shim/youtube-player.js` | Alternative shim endpoint |

#### Test Control API

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/test/youtube/health` | Health check |
| `POST` | `/test/youtube/reset` | Reset state |
| `POST` | `/test/youtube/error-mode` | Configure error simulation |
| `DELETE` | `/test/youtube/error-mode` | Clear error simulation |
| `PUT` | `/test/youtube/fixtures` | Override search fixtures at runtime |

---

## 7. Browser-Side Player Shim

This is the most critical component of this slice. The shim must faithfully replicate the YouTube IFrame Player API surface.

### 7.1 API Surface to Implement

```
// The shim defines window.YT and window.onYouTubeIframeAPIReady

window.YT = {
  Player: class Player {
    /**
     * Constructor matches the real YouTube API:
     * new YT.Player(elementId, {
     *   videoId: 'abc123',
     *   width: 640,
     *   height: 360,
     *   playerVars: { autoplay: 0, controls: 1 },
     *   events: {
     *     onReady: function(event) {},
     *     onStateChange: function(event) {},
     *     onError: function(event) {}
     *   }
     * })
     */
    constructor(elementId, options) { /* ... */ }

    // Playback controls
    playVideo() {}
    pauseVideo() {}
    stopVideo() {}
    seekTo(seconds, allowSeekAhead) {}

    // Volume controls
    setVolume(volume) {}   // 0-100
    getVolume() {}
    mute() {}
    unMute() {}
    isMuted() {}

    // State queries
    getPlayerState() {}     // Returns YT.PlayerState value
    getCurrentTime() {}     // Seconds (float)
    getDuration() {}        // Seconds (float)
    getVideoUrl() {}
    getVideoData() {}       // { video_id, title, author }

    // Sizing
    setSize(width, height) {}

    // Cleanup
    destroy() {}
  },

  PlayerState: {
    UNSTARTED: -1,
    ENDED: 0,
    PLAYING: 1,
    PAUSED: 2,
    BUFFERING: 3,
    CUED: 5,
  },
};
```

### 7.2 Implementation Details

```
// Generated by src/youtube/player-shim.ts and served as JS

(function() {
  const TWIN_BASE = 'http://localhost:9012';

  class Player {
    constructor(elementIdOrElement, options = {}) {
      // Resolve the target element
      this._container = typeof elementIdOrElement === 'string'
        ? document.getElementById(elementIdOrElement)
        : elementIdOrElement;

      this._options = options;
      this._state = -1; // UNSTARTED
      this._volume = 100;
      this._muted = false;

      // Create the HTML5 <video> element
      this._video = document.createElement('video');
      this._video.src = `${TWIN_BASE}/test-assets/sample.mp4`;
      this._video.width = options.width || 640;
      this._video.height = options.height || 360;
      this._video.controls = true;
      this._video.style.width = '100%';
      this._video.style.height = '100%';
      this._video.style.backgroundColor = '#000';

      // Create metadata overlay
      this._overlay = document.createElement('div');
      this._overlay.style.cssText =
        'position:absolute;bottom:0;left:0;right:0;padding:8px;' +
        'background:rgba(0,0,0,0.7);color:#fff;font-size:14px;';
      this._loadVideoMetadata(options.videoId);

      // Wrap in a positioned container
      this._wrapper = document.createElement('div');
      this._wrapper.style.position = 'relative';
      this._wrapper.appendChild(this._video);
      this._wrapper.appendChild(this._overlay);

      // Replace the target element's content
      this._container.innerHTML = '';
      this._container.appendChild(this._wrapper);

      // Wire up video events to YT-compatible callbacks
      this._video.addEventListener('playing', () => {
        this._state = 1; // PLAYING
        this._fireStateChange();
      });
      this._video.addEventListener('pause', () => {
        this._state = 2; // PAUSED
        this._fireStateChange();
      });
      this._video.addEventListener('ended', () => {
        this._state = 0; // ENDED
        this._fireStateChange();
      });
      this._video.addEventListener('waiting', () => {
        this._state = 3; // BUFFERING
        this._fireStateChange();
      });

      // Fire onReady asynchronously (matches real behavior)
      setTimeout(() => {
        if (options.events && options.events.onReady) {
          options.events.onReady({ target: this });
        }
      }, 100);

      // Auto-play if configured
      if (options.playerVars && options.playerVars.autoplay === 1) {
        this._video.play().catch(() => {}); // May be blocked by browser
      }
    }

    async _loadVideoMetadata(videoId) {
      try {
        const res = await fetch(
          `${TWIN_BASE}/youtube/v3/search?q=${videoId}&type=video&maxResults=1&key=test&part=snippet`
        );
        const data = await res.json();
        if (data.items && data.items.length > 0) {
          const snippet = data.items[0].snippet;
          this._videoData = {
            video_id: videoId,
            title: snippet.title,
            author: snippet.channelTitle,
          };
          this._overlay.textContent = `${snippet.title} — ${snippet.channelTitle}`;
        }
      } catch {
        this._overlay.textContent = `Video: ${videoId}`;
      }
    }

    _fireStateChange() {
      if (this._options.events && this._options.events.onStateChange) {
        this._options.events.onStateChange({ target: this, data: this._state });
      }
    }

    playVideo() { this._video.play().catch(() => {}); }
    pauseVideo() { this._video.pause(); }
    stopVideo() { this._video.pause(); this._video.currentTime = 0; }
    seekTo(seconds) { this._video.currentTime = seconds; }

    setVolume(vol) { this._volume = vol; this._video.volume = vol / 100; }
    getVolume() { return this._volume; }
    mute() { this._muted = true; this._video.muted = true; }
    unMute() { this._muted = false; this._video.muted = false; }
    isMuted() { return this._muted; }

    getPlayerState() { return this._state; }
    getCurrentTime() { return this._video.currentTime; }
    getDuration() { return this._video.duration || 0; }
    getVideoUrl() { return `https://www.youtube.com/watch?v=${this._options.videoId || 'test'}`; }
    getVideoData() { return this._videoData || { video_id: this._options.videoId, title: '', author: '' }; }

    setSize(w, h) { this._video.width = w; this._video.height = h; }

    destroy() {
      this._video.pause();
      this._video.src = '';
      this._container.innerHTML = '';
    }
  }

  window.YT = {
    Player,
    PlayerState: {
      UNSTARTED: -1,
      ENDED: 0,
      PLAYING: 1,
      PAUSED: 2,
      BUFFERING: 3,
      CUED: 5,
    },
  };

  // Fire the ready callback (real API does this after script load)
  if (typeof window.onYouTubeIframeAPIReady === 'function') {
    setTimeout(() => window.onYouTubeIframeAPIReady(), 0);
  }
})();
```

### 7.3 Key Fidelity Points

| Behavior | Real YouTube | Shim |
| --- | --- | --- |
| Constructor creates player in target element | Yes | Yes — creates `<video>` in target div |
| `onReady` fires asynchronously after creation | Yes | Yes — via `setTimeout` |
| `onStateChange` fires on play/pause/end | Yes | Yes — wired to `<video>` events |
| `playVideo()` / `pauseVideo()` control playback | Yes | Yes — delegates to `<video>` |
| `getPlayerState()` returns current state constant | Yes | Yes — tracks via event listeners |
| `getCurrentTime()` / `getDuration()` return seconds | Yes | Yes — delegates to `<video>` |
| Volume methods work (0-100 scale) | Yes | Yes — maps to `<video>` 0-1 scale |
| Real video/audio plays | YouTube video | Local `sample.mp4` |
| Metadata overlay shows title/channel | In player chrome | In CSS overlay |

---

## 8. Error Simulation

| Mode | Behavior |
| --- | --- |
| `daily-limit-exceeded` | Search returns 403 with `{ "error": { "errors": [{ "reason": "dailyLimitExceeded" }], "code": 403 } }` |
| `invalid-api-key` | Search returns 400 with `{ "error": { "errors": [{ "reason": "keyInvalid" }], "code": 400 } }` |
| `empty-results` | Search returns valid response with `items: []` and `totalResults: 0` |
| `player-error-2` | Shim fires `onError` with data `2` (invalid video ID) |
| `player-error-5` | Shim fires `onError` with data `5` (HTML5 player error) |
| `player-error-100` | Shim fires `onError` with data `100` (video not found) |
| `player-error-101` | Shim fires `onError` with data `101` (playback not allowed) |
| `player-error-150` | Shim fires `onError` with data `150` (same as 101) |

**Player error modes** are configured via the test control API and communicated to the browser shim by including a `__errorMode` field in the search response that the shim reads. Alternatively, the shim can poll the twin's test control endpoint.

---

## 9. Routing Table Updates

```
{ hostname: 'www.googleapis.com', target: 'http://localhost:9012', pathPrefix: '/youtube/' },
{ hostname: 'www.youtube.com', target: 'http://localhost:9012' },
```

Note: `www.googleapis.com` is shared with other Google APIs. The `pathPrefix` filter ensures only YouTube API paths are routed to this twin. The Calendar twin (slice 5) will add its own prefix.

---

## 10. Sample Media Requirements

### `test-assets/sample.mp4`

* Duration: 5-10 seconds
* Resolution: 720p (1280x720) or lower
* Codec: H.264 + AAC (maximum browser compatibility)
* Content: Royalty-free, visually recognizable (e.g., nature scene, abstract animation)
* License: Public domain or CC0
* Size: Under 2MB

Sources for royalty-free video:

* [Pexels Videos](https://www.pexels.com/videos/) (CC0)
* [Pixabay Videos](https://pixabay.com/videos/) (Pixabay License)
* [Coverr](https://coverr.co/) (free license)

---

## 11. Testing the Twin

```
describe('YouTubeTwin', () => {
  let twin: YouTubeTwin;

  beforeAll(async () => {
    twin = new YouTubeTwin();
    await twin.start();
  });

  afterAll(async () => {
    await twin.stop();
  });

  beforeEach(async () => {
    await twin.reset();
  });

  describe('Search API', () => {
    it('should return search results matching query', async () => {
      const res = await fetch(
        'http://localhost:9012/youtube/v3/search?q=yoga&type=video&maxResults=5&key=test&part=snippet'
      );
      const data = await res.json();
      expect(data.kind).toBe('youtube#searchListResponse');
      expect(data.items.length).toBeGreaterThan(0);
      expect(data.items.length).toBeLessThanOrEqual(5);
      expect(data.items[0].snippet.title.toLowerCase()).toContain('yoga');
    });

    it('should respect maxResults parameter', async () => {
      const res = await fetch(
        'http://localhost:9012/youtube/v3/search?q=test&type=video&maxResults=2&key=test&part=snippet'
      );
      const data = await res.json();
      expect(data.items.length).toBeLessThanOrEqual(2);
    });

    it('should return different results for different queries', async () => {
      const res1 = await fetch('http://localhost:9012/youtube/v3/search?q=yoga&type=video&key=test&part=snippet');
      const res2 = await fetch('http://localhost:9012/youtube/v3/search?q=cooking&type=video&key=test&part=snippet');
      const data1 = await res1.json();
      const data2 = await res2.json();
      expect(data1.items[0].id.videoId).not.toBe(data2.items[0].id.videoId);
    });

    it('should serve thumbnail images', async () => {
      const res = await fetch('http://localhost:9012/test-assets/thumbnail-01.jpg');
      expect(res.ok).toBe(true);
      expect(res.headers.get('content-type')).toContain('image/jpeg');
    });
  });

  describe('IFrame API shim', () => {
    it('should serve the shim JS at /iframe_api', async () => {
      const res = await fetch('http://localhost:9012/iframe_api');
      expect(res.ok).toBe(true);
      const js = await res.text();
      expect(js).toContain('window.YT');
      expect(js).toContain('Player');
      expect(js).toContain('PlayerState');
    });

    it('should serve the sample video', async () => {
      const res = await fetch('http://localhost:9012/test-assets/sample.mp4');
      expect(res.ok).toBe(true);
      expect(res.headers.get('content-type')).toContain('video/mp4');
    });
  });

  describe('Error simulation', () => {
    it('should simulate daily limit exceeded', async () => {
      await fetch('http://localhost:9012/test/youtube/error-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'daily-limit-exceeded' }),
      });
      const res = await fetch('http://localhost:9012/youtube/v3/search?q=test&key=test&part=snippet');
      expect(res.status).toBe(403);
    });

    it('should simulate empty results', async () => {
      await fetch('http://localhost:9012/test/youtube/error-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'empty-results' }),
      });
      const res = await fetch('http://localhost:9012/youtube/v3/search?q=test&key=test&part=snippet');
      const data = await res.json();
      expect(data.items).toHaveLength(0);
    });
  });
});

describe('YT.Player shim (browser)', () => {
  // These tests run in a browser context (e.g., Playwright)

  it('should create a video element in the target div', async () => {
    // Evaluate in browser: new YT.Player('player', { videoId: 'test-vid-001' })
    // Assert: #player contains a <video> element
  });

  it('should fire onReady callback', async () => {
    // Assert: onReady fires within 500ms of construction
  });

  it('should fire onStateChange on play/pause', async () => {
    // Play and pause, assert correct state values
  });

  it('should display video metadata overlay', async () => {
    // Assert: overlay shows title and channel from fixtures
  });
});
```

---

## 12. Checklist

* Search endpoint returns realistic YouTube API responses
* Search is query-aware (different queries, different results)
* `maxResults` parameter is respected
* Thumbnails are served locally and referenced in search results
* IFrame API shim is served at `/iframe_api`
* `window.YT.Player` constructor works with `elementId` and options
* Player shim creates HTML5 `<video>` element with local `sample.mp4`
* `onReady` fires asynchronously after construction
* `onStateChange` fires with correct state values on play/pause/end
* `playVideo()`, `pauseVideo()`, `seekTo()` work correctly
* Volume methods map correctly (0-100 to 0-1)
* `getPlayerState()`, `getCurrentTime()`, `getDuration()` return accurate values
* `YT.PlayerState` constants match real YouTube values
* `onYouTubeIframeAPIReady` callback fires after shim loads
* Video metadata overlay displays title and channel
* `sample.mp4` is royalty-free, under 2MB, H.264+AAC
* Error simulation modes work (API errors and player errors)
* Routing table updated for `www.googleapis.com/youtube/` and `www.youtube.com`
* All twin and shim tests pass

‌