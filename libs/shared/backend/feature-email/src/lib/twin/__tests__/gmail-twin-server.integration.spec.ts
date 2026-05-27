import { GmailTwinServer } from '../gmail-twin-server.js';
import {
  NodeInterceptor,
  RoutingTable,
} from '@open-kingdom/shared-backend-integration-test-doubles';
import { buildRawEmail } from '../test-utils.js';

interface CapturedEmailJson {
  id: string;
  threadId: string;
  to: string[];
  from: string;
  subject: string;
  text?: string;
  html?: string;
  timestamp: string;
  raw: string;
}

describe('GmailTwinServer E2E Integration Interception', () => {
  let twin: GmailTwinServer;
  let interceptor: NodeInterceptor;
  const testPort = 9015;

  beforeAll(async () => {
    // 1. Initialize and start the digital twin NestJS mock server
    twin = new GmailTwinServer({ port: testPort, disableAuth: false });
    await twin.start();

    // 2. Set up the RoutingTable to route production gmail.googleapis.com requests to our local test port
    const routingTable = new RoutingTable([
      {
        hostname: 'gmail.googleapis.com',
        target: `http://localhost:${testPort}`,
      },
    ]);

    // 3. Instantiate and install NodeInterceptor
    interceptor = new NodeInterceptor(routingTable);
    interceptor.install();
  });

  afterAll(async () => {
    // 1. Uninstall the interceptor to restore native global fetch
    if (interceptor) {
      interceptor.uninstall();
    }

    // 2. Cleanly stop the digital twin mock server
    if (twin) {
      await twin.stop();
    }
  });

  beforeEach(async () => {
    if (twin) {
      await twin.reset();
    }
  });

  it('should dynamically intercept a native, production global fetch call and transparently redirect to local Twin emulator', async () => {
    const rawEmail = buildRawEmail({
      to: 'prod-target@openkingdom.dev',
      from: 'app-sender@openkingdom.dev',
      subject: 'Dynamic E2E Network Interception Verification',
      text: 'This is the plaintext content that should bypass DNS and route to local digital twin.',
    });

    // Make a standard fetch call as if talking to Google Gmail Production APIs
    const response = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer header.payload.signature',
        },
        body: JSON.stringify({ raw: rawEmail }),
      }
    );

    expect(response.status).toBe(200);
    const result = (await response.json()) as { id: string; threadId: string };
    expect(result.id).toBeDefined();

    // Now, verify that the twin captured the email in-memory by directly querying the local twin's control endpoint
    const controlRes = await fetch(
      `http://localhost:${testPort}/test/gmail/emails`
    );
    expect(controlRes.status).toBe(200);
    const emails = (await controlRes.json()) as CapturedEmailJson[];
    expect(emails).toHaveLength(1);
    expect(emails[0].id).toBe(result.id);
    expect(emails[0].to).toContain('prod-target@openkingdom.dev');
    expect(emails[0].from).toBe('app-sender@openkingdom.dev');
    expect(emails[0].subject).toBe(
      'Dynamic E2E Network Interception Verification'
    );
    expect(emails[0].text).toBe(
      'This is the plaintext content that should bypass DNS and route to local digital twin.'
    );
  });

  it('should transparently forward injected fault simulation exceptions (e.g., 429 Rate Limit) through NodeInterceptor', async () => {
    // 1. Configure the simulated error mode to 'rate-limit' on the local twin emulator
    const configRes = await fetch(
      `http://localhost:${testPort}/test/gmail/error-mode`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mode: 'rate-limit' }),
      }
    );
    expect(configRes.status).toBe(200);

    const rawEmail = buildRawEmail({
      to: 'victim@openkingdom.dev',
      from: 'app-sender@openkingdom.dev',
      subject: 'Rate Limit Test',
      text: 'Should fail with 429',
    });

    // 2. Perform global fetch call to production API
    const response = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer header.payload.signature',
        },
        body: JSON.stringify({ raw: rawEmail }),
      }
    );

    // 3. Verify that the global fetch was intercepted, redirected, and returned the simulated 429 response!
    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBe('60');
    const errorJson = (await response.json()) as {
      error: { code: number; message: string };
    };
    expect(errorJson.error.code).toBe(429);
    expect(errorJson.error.message).toBe('User Rate Limit Exceeded');
  });
});
