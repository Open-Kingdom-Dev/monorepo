import { YoutubeTwin } from '../youtube-twin.js';
import {
  createYoutubeConfig,
} from '../youtube-twin.config.js';
import { DEFAULT_PORTS, ENV_VARS } from '../../shared/constants.js';

describe('YoutubeTwin Configuration', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should use default values', () => {
    const config = createYoutubeConfig();
    expect(config.port).toBe(DEFAULT_PORTS.YOUTUBE);
    expect(config.externalUrl).toBe(`http://localhost:${DEFAULT_PORTS.YOUTUBE}`);
    expect(config.sampleVideoPath).toContain('sample.mp4');
    expect(config.thumbnailDir).toContain('thumbnails');
  });

  it('should override port with environment variable', () => {
    process.env[ENV_VARS.YOUTUBE_TWIN_PORT] = '9020';
    const config = createYoutubeConfig();
    expect(config.port).toBe(9020);
    expect(config.externalUrl).toBe('http://localhost:9020');
  });

  it('should prioritize explicit overrides over environment variables', () => {
    process.env[ENV_VARS.YOUTUBE_TWIN_PORT] = '9020';
    const config = createYoutubeConfig({ port: 9019 });
    expect(config.port).toBe(9019);
    expect(config.externalUrl).toBe('http://localhost:9019');
  });

  it('should throw error for out-of-range port', () => {
    expect(() => createYoutubeConfig({ port: 8080 })).toThrow(
      /is outside the reserved range/
    );
  });
});

describe('YoutubeTwin Server Lifecycle', () => {
  let twin: YoutubeTwin;
  const TEST_PORT = 9019;
  const TEST_URL = `http://localhost:${TEST_PORT}`;

  beforeEach(() => {
    twin = new YoutubeTwin({ port: TEST_PORT });
  });

  afterEach(async () => {
    await twin.stop();
  });

  it('should start and stop the server correctly', async () => {
    expect(await twin.isHealthy()).toBe(false);

    await twin.start();
    expect(await twin.isHealthy()).toBe(true);

    await twin.stop();
    expect(await twin.isHealthy()).toBe(false);
  });

  it('should handle idempotent starts and stops', async () => {
    await twin.start();
    await expect(twin.start()).resolves.not.toThrow();

    await twin.stop();
    await expect(twin.stop()).resolves.not.toThrow();
  });

  it('should serve health check endpoint', async () => {
    await twin.start();

    const response = await fetch(`${TEST_URL}/test/youtube/health`, {
      headers: { Connection: 'close' },
    });
    expect(response.status).toBe(200);

    const body: any = await response.json();
    expect(body).toEqual({ status: 'ok' });
  });

  it('should serve reset endpoint', async () => {
    await twin.start();

    const response = await fetch(`${TEST_URL}/test/youtube/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Connection: 'close',
      },
    });
    expect(response.status).toBe(200);

    const body: any = await response.json();
    expect(body).toEqual({ success: true });
  });

  it('should serve static assets correctly', async () => {
    await twin.start();

    // Verify sample video serving
    const videoResponse = await fetch(`${TEST_URL}/test-assets/sample.mp4`, {
      headers: { Connection: 'close' },
    });
    expect(videoResponse.status).toBe(200);
    expect(videoResponse.headers.get('content-type')).toContain('video/mp4');
    await videoResponse.arrayBuffer(); // Consume body

    // Verify thumbnail serving
    const thumbnailResponse = await fetch(
      `${TEST_URL}/test-assets/thumbnails/thumbnail-01.jpg`,
      {
        headers: { Connection: 'close' },
      }
    );
    expect(thumbnailResponse.status).toBe(200);
    expect(thumbnailResponse.headers.get('content-type')).toContain('image/jpeg');
    await thumbnailResponse.arrayBuffer(); // Consume body
  });

  it('should reject search requests missing an API key', async () => {
    await twin.start();

    const response = await fetch(`${TEST_URL}/youtube/v3/search?q=yoga`, {
      headers: { Connection: 'close' },
    });
    expect(response.status).toBe(400);

    const body: any = await response.json();
    expect(body).toEqual({
      error: {
        code: 400,
        message: 'API key not valid. Please pass a valid API key.',
        errors: [
          {
            domain: 'usageLimits',
            reason: 'keyInvalid',
            message: 'API key not valid.',
          },
        ],
      },
    });
  });

  it('should serve search endpoint and respect maxResults', async () => {
    await twin.start();

    const response = await fetch(
      `${TEST_URL}/youtube/v3/search?q=programming&maxResults=2&key=test-key`,
      {
        headers: { Connection: 'close' },
      }
    );
    expect(response.status).toBe(200);

    const body: any = await response.json();
    expect(body.kind).toBe('youtube#searchListResponse');
    expect(body.items.length).toBe(2);
    body.items.forEach((item: any) => {
      expect(item.id.videoId).toBeDefined();
      expect(item.snippet.title).toBeDefined();
    });
  });

  it('should return reachable thumbnail URLs in search results', async () => {
    await twin.start();

    const searchResponse = await fetch(
      `${TEST_URL}/youtube/v3/search?q=programming&maxResults=1&key=test-key`,
      {
        headers: { Connection: 'close' },
      }
    );
    expect(searchResponse.status).toBe(200);
    const searchBody: any = await searchResponse.json();
    expect(searchBody.items.length).toBeGreaterThan(0);

    const thumbUrl = searchBody.items[0].snippet.thumbnails.default.url;
    expect(thumbUrl).toContain('/test-assets/thumbnails/');

    const thumbResponse = await fetch(thumbUrl, {
      headers: { Connection: 'close' },
    });
    expect(thumbResponse.status).toBe(200);
    expect(thumbResponse.headers.get('content-type')).toContain('image/jpeg');
    await thumbResponse.arrayBuffer(); // Consume body
  });

  it('should support custom fixtures override and resetting to default', async () => {
    await twin.start();

    const customFixtures = [
      {
        videoId: 'custom-mock-vid',
        title: 'Only Custom Video exists',
        channelTitle: 'Custom Channel',
        channelId: 'UC-custom-001',
        description: 'Custom description for override test.',
        publishedAt: '2024-03-20T12:00:00Z',
        thumbnailIndex: 5,
        duration: 'PT3M10S',
        viewCount: '1000',
        tags: ['custom', 'test'],
      },
    ];

    const putResponse = await fetch(`${TEST_URL}/test/youtube/fixtures`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Connection: 'close',
      },
      body: JSON.stringify({ fixtures: customFixtures }),
    });
    expect(putResponse.status).toBe(200);
    const putBody: any = await putResponse.json();
    expect(putBody).toEqual({ success: true, count: 1 });

    const searchResponse = await fetch(
      `${TEST_URL}/youtube/v3/search?q=programming&key=test-key`,
      {
        headers: { Connection: 'close' },
      }
    );
    expect(searchResponse.status).toBe(200);
    const searchBody: any = await searchResponse.json();
    expect(searchBody.items.length).toBe(1);
    expect(searchBody.items[0].id.videoId).toBe('custom-mock-vid');

    const resetResponse = await fetch(`${TEST_URL}/test/youtube/reset`, {
      method: 'POST',
      headers: { Connection: 'close' },
    });
    expect(resetResponse.status).toBe(200);
    await resetResponse.json();

    const defaultSearchResponse = await fetch(
      `${TEST_URL}/youtube/v3/search?q=programming&key=test-key`,
      {
        headers: { Connection: 'close' },
      }
    );
    expect(defaultSearchResponse.status).toBe(200);
    const defaultSearchBody: any = await defaultSearchResponse.json();
    expect(defaultSearchBody.items.length).toBe(2);
    expect(defaultSearchBody.items[0].id.videoId).not.toBe('custom-mock-vid');
  });

  describe('YouTube Error Simulation', () => {
    beforeEach(async () => {
      await twin.start();
    });

    afterEach(async () => {
      await fetch(`${TEST_URL}/test/youtube/error-mode`, {
        method: 'DELETE',
        headers: { Connection: 'close' },
      });
    });

    it('should initially have error mode disabled', async () => {
      const res = await fetch(`${TEST_URL}/test/youtube/error-mode`, {
        headers: { Connection: 'close' },
      });
      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(body).toEqual({ active: false, mode: null });
    });

    it('should set, query, and delete error mode via API', async () => {
      // Set daily limit error mode
      const setRes = await fetch(`${TEST_URL}/test/youtube/error-mode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Connection: 'close',
        },
        body: JSON.stringify({ mode: 'daily-limit-exceeded' }),
      });
      expect(setRes.status).toBe(200);
      const setBody: any = await setRes.json();
      expect(setBody).toEqual({ success: true, mode: 'daily-limit-exceeded' });

      // Query active error mode
      const getRes = await fetch(`${TEST_URL}/test/youtube/error-mode`, {
        headers: { Connection: 'close' },
      });
      expect(getRes.status).toBe(200);
      const getBody: any = await getRes.json();
      expect(getBody).toEqual({ active: true, mode: 'daily-limit-exceeded' });

      // Delete error mode
      const delRes = await fetch(`${TEST_URL}/test/youtube/error-mode`, {
        method: 'DELETE',
        headers: { Connection: 'close' },
      });
      expect(delRes.status).toBe(200);
      const delBody: any = await delRes.json();
      expect(delBody).toEqual({ success: true, mode: null });

      // Verify no active mode
      let checkRes = await fetch(`${TEST_URL}/test/youtube/error-mode`, {
        headers: { Connection: 'close' },
      });
      const checkBody: any = await checkRes.json();
      expect(checkBody).toEqual({ active: false, mode: null });
    });

    it('should return 400 validation error if missing mode in POST body', async () => {
      const res = await fetch(`${TEST_URL}/test/youtube/error-mode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Connection: 'close',
        },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(400);
      const body: any = await res.json();
      expect(body.error).toContain('Missing "mode" field');
    });

    it('should simulate daily limit exceeded (403) search error', async () => {
      await fetch(`${TEST_URL}/test/youtube/error-mode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Connection: 'close',
        },
        body: JSON.stringify({ mode: 'daily-limit-exceeded' }),
      });

      const searchRes = await fetch(`${TEST_URL}/youtube/v3/search?q=yoga&key=valid-key`, {
        headers: { Connection: 'close' },
      });
      expect(searchRes.status).toBe(403);
      const body: any = await searchRes.json();
      expect(body.error.code).toBe(403);
      expect(body.error.message).toBe('Daily Limit Exceeded');
      expect(body.error.errors[0].reason).toBe('dailyLimitExceeded');
    });

    it('should simulate invalid api key (400) search error', async () => {
      await fetch(`${TEST_URL}/test/youtube/error-mode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Connection: 'close',
        },
        body: JSON.stringify({ mode: 'invalid-api-key' }),
      });

      const searchRes = await fetch(`${TEST_URL}/youtube/v3/search?q=yoga&key=valid-key`, {
        headers: { Connection: 'close' },
      });
      expect(searchRes.status).toBe(400);
      const body: any = await searchRes.json();
      expect(body.error.code).toBe(400);
      expect(body.error.message).toBe('API key not valid');
      expect(body.error.errors[0].reason).toBe('keyInvalid');
    });

    it('should simulate empty search results (200, items: [])', async () => {
      await fetch(`${TEST_URL}/test/youtube/error-mode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Connection: 'close',
        },
        body: JSON.stringify({ mode: 'empty-results' }),
      });

      const searchRes = await fetch(`${TEST_URL}/youtube/v3/search?q=yoga&key=valid-key`, {
        headers: { Connection: 'close' },
      });
      expect(searchRes.status).toBe(200);
      const body: any = await searchRes.json();
      expect(body.kind).toBe('youtube#searchListResponse');
      expect(body.items).toEqual([]);
      expect(body.pageInfo.totalResults).toBe(0);
    });

    it('should inject player error mode __twinErrorMode in search results', async () => {
      await fetch(`${TEST_URL}/test/youtube/error-mode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Connection: 'close',
        },
        body: JSON.stringify({ mode: 'player-error-101' }),
      });

      const searchRes = await fetch(`${TEST_URL}/youtube/v3/search?q=yoga&key=valid-key`, {
        headers: { Connection: 'close' },
      });
      expect(searchRes.status).toBe(200);
      const body: any = await searchRes.json();
      expect(body.__twinErrorMode).toEqual({ playerError: 101 });
    });

    it('should clear error mode on twin reset()', async () => {
      await fetch(`${TEST_URL}/test/youtube/error-mode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Connection: 'close',
        },
        body: JSON.stringify({ mode: 'daily-limit-exceeded' }),
      });

      // Reset
      await fetch(`${TEST_URL}/test/youtube/reset`, {
        method: 'POST',
        headers: { Connection: 'close' },
      });

      const checkRes = await fetch(`${TEST_URL}/test/youtube/error-mode`, {
        headers: { Connection: 'close' },
      });
      const checkBody: any = await checkRes.json();
      expect(checkBody).toEqual({ active: false, mode: null });
    });
  });
});

