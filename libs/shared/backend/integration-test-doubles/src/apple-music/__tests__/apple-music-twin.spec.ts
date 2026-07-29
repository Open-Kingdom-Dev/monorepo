import { AppleMusicTwin } from '../apple-music-twin.js';
import { createAppleMusicConfig } from '../apple-music-twin.config.js';
import { DEFAULT_PORTS, ENV_VARS } from '../../shared/constants.js';

describe('AppleMusicTwin Configuration', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should use default values', () => {
    const config = createAppleMusicConfig();
    expect(config.port).toBe(DEFAULT_PORTS.APPLE_MUSIC);
    expect(config.externalUrl).toBe(`http://localhost:${DEFAULT_PORTS.APPLE_MUSIC}`);
  });

  it('should override port with environment variable', () => {
    process.env[ENV_VARS.APPLE_MUSIC_TWIN_PORT] = '9020';
    const config = createAppleMusicConfig();
    expect(config.port).toBe(9020);
    expect(config.externalUrl).toBe('http://localhost:9020');
  });

  it('should prioritize explicit overrides over environment variables', () => {
    process.env[ENV_VARS.APPLE_MUSIC_TWIN_PORT] = '9020';
    const config = createAppleMusicConfig({ port: 9019 });
    expect(config.port).toBe(9019);
    expect(config.externalUrl).toBe('http://localhost:9019');
  });

  it('should throw error for out-of-range port', () => {
    expect(() => createAppleMusicConfig({ port: 8080 })).toThrow(/is outside the reserved range/);
  });
});

describe('AppleMusicTwin Server Lifecycle', () => {
  let twin: AppleMusicTwin;
  const TEST_PORT = 9017;
  const TEST_URL = `http://localhost:${TEST_PORT}`;

  beforeEach(() => {
    twin = new AppleMusicTwin({ port: TEST_PORT });
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

  it('should serve catalog search', async () => {
    await twin.start();

    const response = await fetch(`${TEST_URL}/v1/catalog/us/search?term=Meditation&types=songs`);
    expect(response.status).toBe(200);

    const body: any = await response.json();
    expect(body.results.songs).toBeDefined();
    expect(body.results.songs.data[0].id).toBe('mock-track-001');
  });

  it('should serve single songs', async () => {
    await twin.start();

    const response = await fetch(`${TEST_URL}/v1/catalog/us/songs/mock-track-001`);
    expect(response.status).toBe(200);

    const body: any = await response.json();
    expect(body.data[0].attributes.name).toBe('Morning Meditation Calm');
  });

  it('should serve browser-side SDK musickit.js shim', async () => {
    await twin.start();

    const response = await fetch(`${TEST_URL}/musickit.js`);
    expect(response.status).toBe(200);

    const body = await response.text();
    expect(body).toContain('window.MusicKit =');
    expect(body).toContain('document.dispatchEvent(new Event(\'musickitloaded\'));');
  });

  it('should handle simulated errors', async () => {
    await twin.start();

    // Activate error mode
    let res = await fetch(`${TEST_URL}/test/apple-music/error-mode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'unauthorized' }),
    });
    expect(res.status).toBe(200);

    // Call catalog endpoint and expect 401
    res = await fetch(`${TEST_URL}/v1/catalog/us/songs/mock-track-001`);
    expect(res.status).toBe(401);
    const body: any = await res.json();
    expect(body.errors[0].title).toBe('Unauthorized');

    // Deactivate error mode
    res = await fetch(`${TEST_URL}/test/apple-music/error-mode`, { method: 'DELETE' });
    expect(res.status).toBe(200);

    res = await fetch(`${TEST_URL}/v1/catalog/us/songs/mock-track-001`);
    expect(res.status).toBe(200);
  });
});
