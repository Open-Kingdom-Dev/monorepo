/* eslint-disable @typescript-eslint/no-explicit-any */
import { YoutubeTwin } from '../youtube-twin.js';
import { NodeInterceptor } from '../../interceptor/node-interceptor.js';
import { RoutingTable } from '../../interceptor/routing-table.js';
import { defaultRoutingEntries } from '../../interceptor/routing-table.config.js';
import { getYoutubeMswHandlerConfigs } from '../msw-handlers.js';

describe('YouTube Twin E2E Interception', () => {
  let twin: YoutubeTwin;
  let interceptor: NodeInterceptor;
  const TEST_PORT = 9020;

  beforeAll(async () => {
    // Start twin on port 9020
    twin = new YoutubeTwin({
      port: TEST_PORT,
      externalUrl: `http://localhost:${TEST_PORT}`,
    });
    await twin.start();

    // Setup Routing Table using the test port
    const testEntries = defaultRoutingEntries.map((entry) => {
      if (entry.target.includes('9016')) {
        return { ...entry, target: `http://localhost:${TEST_PORT}` };
      }
      return entry;
    });

    const routingTable = new RoutingTable(testEntries);
    interceptor = new NodeInterceptor(routingTable);
  });

  afterAll(async () => {
    interceptor.uninstall();
    await twin.stop();
  });

  it('should intercept googleapis.com search and route to twin', async () => {
    interceptor.install();

    const response = await fetch(
      'https://www.googleapis.com/youtube/v3/search?q=programming&key=test-key',
      {
        headers: { Connection: 'close' },
      }
    );

    expect(response.status).toBe(200);
    const body: any = await response.json();
    expect(body.kind).toBe('youtube#searchListResponse');
    expect(body.items.length).toBeGreaterThan(0);

    interceptor.uninstall();
  });

  it('should intercept www.youtube.com/iframe_api script fetch and route to twin', async () => {
    interceptor.install();

    const response = await fetch('https://www.youtube.com/iframe_api', {
      headers: { Connection: 'close' },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain(
      'application/javascript'
    );
    const text = await response.text();
    expect(text).toContain('window.YT =');
    expect(text).toContain(`http://localhost:${TEST_PORT}`);

    interceptor.uninstall();
  });

  it('should export valid MSW handler configurations', () => {
    const configs = getYoutubeMswHandlerConfigs(
      `http://localhost:${TEST_PORT}`
    );
    expect(configs.length).toBe(2);
    expect(configs[0].url).toBe('https://www.youtube.com/iframe_api');
    expect(configs[0].proxyTo).toBe(`http://localhost:${TEST_PORT}/iframe_api`);
    expect(configs[0].contentType).toBe('application/javascript');
  });
});
