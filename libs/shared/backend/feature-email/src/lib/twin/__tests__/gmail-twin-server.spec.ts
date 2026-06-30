import { GmailTwinServer } from '../gmail-twin-server.js';
import { buildRawEmail } from '../test-utils.js';

describe('GmailTwinServer', () => {
  let twin: GmailTwinServer;

  beforeAll(async () => {
    twin = new GmailTwinServer({ port: 9014, disableAuth: false });
    await twin.start();
  });

  afterAll(async () => {
    await twin.stop();
  });

  beforeEach(async () => {
    await twin.reset();
  });

  it('should respond to health check when running', async () => {
    expect(await twin.isHealthy()).toBe(true);

    const healthUrl = `${twin.getEmulatorHost()}/test/gmail/health`;
    const res = await fetch(healthUrl);
    expect(res.status).toBe(200);
    const data = (await res.json()) as { status: string };
    expect(data.status).toBe('ok');
  });

  it('should enforce BearerJwtGuard security on data plane routes', async () => {
    const sendUrl = `${twin.getEmulatorHost()}/gmail/v1/users/me/messages/send`;

    // 1. Missing Authorization header
    const resNoAuth = await fetch(sendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw: 'some-raw-mime' }),
    });
    expect(resNoAuth.status).toBe(401);

    // 2. Invalid Authorization prefix
    const resBadPrefix = await fetch(sendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic dXNlcjpwYXNz',
      },
      body: JSON.stringify({ raw: 'some-raw-mime' }),
    });
    expect(resBadPrefix.status).toBe(401);

    // 3. Structurally invalid JWT (not 3 dots)
    const resBadJwt = await fetch(sendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer header.payload',
      },
      body: JSON.stringify({ raw: 'some-raw-mime' }),
    });
    expect(resBadJwt.status).toBe(401);
  });

  it('should process sending emails, parse MIME base64url data, and query via control plane LIFO store', async () => {
    const host = twin.getEmulatorHost();

    // Generate valid RFC 5322 raw email
    const rawEmail = buildRawEmail({
      to: 'recipient@example.com',
      from: 'sender@example.com',
      subject: 'Strict NestJS digital twin test',
      text: 'This is a strictly typed email body.',
      html: '<p>This is a strictly typed email body.</p>',
    });

    // Send email with a structurally valid JWT (3 parts)
    const sendRes = await fetch(`${host}/gmail/v1/users/me/messages/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer header.payload.signature',
      },
      body: JSON.stringify({ raw: rawEmail }),
    });

    expect(sendRes.status).toBe(200);
    const sendResult = (await sendRes.json()) as {
      id: string;
      threadId: string;
      labelIds: string[];
    };
    expect(sendResult.id).toBeDefined();
    expect(sendResult.threadId).toBeDefined();
    expect(sendResult.labelIds).toContain('SENT');

    // Retrieve via control plane endpoint
    const getRes = await fetch(`${host}/test/gmail/emails`);
    expect(getRes.status).toBe(200);
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
    const emails = (await getRes.json()) as CapturedEmailJson[];
    expect(emails).toHaveLength(1);
    expect(emails[0].id).toBe(sendResult.id);
    expect(emails[0].to).toContain('recipient@example.com');
    expect(emails[0].from).toBe('sender@example.com');
    expect(emails[0].subject).toBe('Strict NestJS digital twin test');
    expect(emails[0].text).toBe('This is a strictly typed email body.');
    expect(emails[0].html).toBe('<p>This is a strictly typed email body.</p>');
    expect(emails[0].raw).toBe(rawEmail);

    // Retrieve via filtered query
    const filteredRes = await fetch(
      `${host}/test/gmail/emails?to=recipient@example.com`
    );
    const filteredEmails = (await filteredRes.json()) as CapturedEmailJson[];
    expect(filteredEmails).toHaveLength(1);

    const unfilteredRes = await fetch(
      `${host}/test/gmail/emails?to=other@example.com`
    );
    const unfilteredEmails =
      (await unfilteredRes.json()) as CapturedEmailJson[];
    expect(unfilteredEmails).toHaveLength(0);

    // Reset control plane
    const resetRes = await fetch(`${host}/test/gmail/reset`, {
      method: 'POST',
    });
    expect(resetRes.status).toBe(200);

    const afterResetRes = await fetch(`${host}/test/gmail/emails`);
    const afterResetEmails =
      (await afterResetRes.json()) as CapturedEmailJson[];
    expect(afterResetEmails).toHaveLength(0);
  });

  describe('Error Simulation Integration', () => {
    interface GoogleApiErrorResponse {
      error: {
        code: number;
        message: string;
        errors?: Array<{
          message: string;
          domain: string;
          reason: string;
        }>;
      };
    }

    it('should set and clear error simulation mode via control plane', async () => {
      const host = twin.getEmulatorHost();

      // 1. Set mode to rate-limit
      const setRes = await fetch(`${host}/test/gmail/error-mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'rate-limit' }),
      });
      expect(setRes.status).toBe(200);
      const setJson = (await setRes.json()) as {
        success: boolean;
        mode: string;
      };
      expect(setJson.success).toBe(true);
      expect(setJson.mode).toBe('rate-limit');

      // 2. Clear mode via DELETE
      const deleteRes = await fetch(`${host}/test/gmail/error-mode`, {
        method: 'DELETE',
      });
      expect(deleteRes.status).toBe(200);
      const deleteJson = (await deleteRes.json()) as {
        success: boolean;
        mode: null;
      };
      expect(deleteJson.success).toBe(true);
      expect(deleteJson.mode).toBeNull();
    });

    it('should validate error-mode input payloads on control plane', async () => {
      const host = twin.getEmulatorHost();

      const badRes = await fetch(`${host}/test/gmail/error-mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'unsupported-fault' }),
      });
      expect(badRes.status).toBe(400);
    });

    it('should simulate a 403 Forbidden insufficient-permissions fault', async () => {
      const host = twin.getEmulatorHost();

      // Activate insufficient-permissions mode
      await fetch(`${host}/test/gmail/error-mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'insufficient-permissions' }),
      });

      // Try sending an email
      const rawEmail = buildRawEmail({
        to: 'recipient@example.com',
        from: 'sender@example.com',
        subject: 'Forbidden Simulation',
        text: 'Hello world',
      });

      const res = await fetch(`${host}/gmail/v1/users/me/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer header.payload.signature',
        },
        body: JSON.stringify({ raw: rawEmail }),
      });

      expect(res.status).toBe(403);
      const errorJson = (await res.json()) as GoogleApiErrorResponse;
      expect(errorJson.error.code).toBe(403);
      expect(errorJson.error.message).toBe('Insufficient Permission');
      expect(errorJson.error.errors).toBeDefined();
      expect(errorJson.error.errors?.[0].reason).toBe(
        'insufficientPermissions'
      );
      expect(errorJson.error.errors?.[0].domain).toBe('global');
    });

    it('should simulate a 429 Too Many Requests rate-limit fault and set Retry-After header', async () => {
      const host = twin.getEmulatorHost();

      // Activate rate-limit mode
      await fetch(`${host}/test/gmail/error-mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'rate-limit' }),
      });

      // Try sending an email
      const rawEmail = buildRawEmail({
        to: 'recipient@example.com',
        from: 'sender@example.com',
        subject: 'Rate Limit Simulation',
        text: 'Hello world',
      });

      const res = await fetch(`${host}/gmail/v1/users/me/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer header.payload.signature',
        },
        body: JSON.stringify({ raw: rawEmail }),
      });

      expect(res.status).toBe(429);
      expect(res.headers.get('retry-after')).toBe('60');

      const errorJson = (await res.json()) as GoogleApiErrorResponse;
      expect(errorJson.error.code).toBe(429);
      expect(errorJson.error.message).toBe('User Rate Limit Exceeded');
      expect(errorJson.error.errors?.[0].reason).toBe('userRateLimitExceeded');
      expect(errorJson.error.errors?.[0].domain).toBe('usageLimits');
    });

    it('should simulate a 400 Bad Request invalid-recipient fault', async () => {
      const host = twin.getEmulatorHost();

      // Activate invalid-recipient mode
      await fetch(`${host}/test/gmail/error-mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'invalid-recipient' }),
      });

      // Try sending an email
      const rawEmail = buildRawEmail({
        to: 'recipient@example.com',
        from: 'sender@example.com',
        subject: 'Invalid Recipient Simulation',
        text: 'Hello world',
      });

      const res = await fetch(`${host}/gmail/v1/users/me/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer header.payload.signature',
        },
        body: JSON.stringify({ raw: rawEmail }),
      });

      expect(res.status).toBe(400);
      const errorJson = (await res.json()) as GoogleApiErrorResponse;
      expect(errorJson.error.code).toBe(400);
      expect(errorJson.error.message).toBe('Invalid recipient address format');
      expect(errorJson.error.errors?.[0].reason).toBe('invalidArgument');
      expect(errorJson.error.errors?.[0].domain).toBe('global');
    });

    it('should clear active error modes when reset is triggered', async () => {
      const host = twin.getEmulatorHost();

      // Activate invalid-recipient mode
      await fetch(`${host}/test/gmail/error-mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'invalid-recipient' }),
      });

      // Reset the control plane
      const resetRes = await fetch(`${host}/test/gmail/reset`, {
        method: 'POST',
      });
      expect(resetRes.status).toBe(200);

      // Verify email sending works again (fault was cleared)
      const rawEmail = buildRawEmail({
        to: 'recipient@example.com',
        from: 'sender@example.com',
        subject: 'Fault Cleared Simulation',
        text: 'Hello world',
      });

      const sendRes = await fetch(`${host}/gmail/v1/users/me/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer header.payload.signature',
        },
        body: JSON.stringify({ raw: rawEmail }),
      });

      expect(sendRes.status).toBe(200);
    });

    it('should return 500 when active error mode is unknown', async () => {
      const service = (
        twin as unknown as {
          service: {
            setErrorMode(mode: string): void;
            reset(): void;
            sendEmail: jest.Mock;
          };
        }
      ).service;
      service.setErrorMode('unknown-mode' as unknown as never);

      try {
        const host = twin.getEmulatorHost();
        const res = await fetch(`${host}/gmail/v1/users/me/messages/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer header.payload.signature',
          },
          body: JSON.stringify({ raw: 'some-raw' }),
        });
        expect(res.status).toBe(500);
        const json = (await res.json()) as { error: { message: string } };
        expect(json.error.message).toBe('Unknown simulated error mode');
      } finally {
        service.reset();
      }
    });

    it('should return 500 when service throws non-HttpException', async () => {
      const service = (
        twin as unknown as {
          service: {
            setErrorMode(mode: string): void;
            reset(): void;
            sendEmail: jest.Mock;
          };
        }
      ).service;
      const originalSend = service.sendEmail;
      service.sendEmail = jest
        .fn()
        .mockRejectedValue(new Error('Internal Database Error'));

      try {
        const host = twin.getEmulatorHost();
        const res = await fetch(`${host}/gmail/v1/users/me/messages/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer header.payload.signature',
          },
          body: JSON.stringify({ raw: 'some-raw' }),
        });
        expect(res.status).toBe(500);
        const json = (await res.json()) as { error: { message: string } };
        expect(json.error.message).toContain('Internal Database Error');
      } finally {
        service.sendEmail = originalSend;
      }
    });
  });

  describe('Control Plane Endpoints', () => {
    it('should respond to token endpoints', async () => {
      const host = twin.getEmulatorHost();
      for (const path of ['/token', '/oauth2/v4/token', '/oauth2/v3/token']) {
        const res = await fetch(`${host}${path}`, { method: 'POST' });
        expect(res.status).toBe(200);
        const json = (await res.json()) as { access_token: string };
        expect(json.access_token).toBe('mock-twin-access-token');
      }
    });

    it('should return 400 when sending message with missing raw field', async () => {
      const host = twin.getEmulatorHost();
      const res = await fetch(`${host}/gmail/v1/users/me/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer header.payload.signature',
        },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(400);
    });
  });

  describe('Unstarted Server', () => {
    it('should throw errors when accessing service properties before start', () => {
      const unstartedTwin = new GmailTwinServer({ port: 9016 });
      expect(() => unstartedTwin.getEmailStore()).toThrow(
        'GmailTwinServer has not been started yet'
      );
      expect(() => unstartedTwin.getEmails()).toThrow(
        'GmailTwinServer has not been started yet'
      );
      expect(() => unstartedTwin.setErrorMode(null)).toThrow(
        'GmailTwinServer has not been started yet'
      );
      expect(() => unstartedTwin.getErrorMode()).toThrow(
        'GmailTwinServer has not been started yet'
      );
    });

    it('should return false for health check when unstarted', async () => {
      const unstartedTwin = new GmailTwinServer({
        port: 9017,
        externalUrl: 'http://localhost:9017',
      });
      const healthy = await unstartedTwin.isHealthy();
      expect(healthy).toBe(false);
    });
  });

  describe('Disable Auth Server', () => {
    let noAuthTwin: GmailTwinServer;
    beforeAll(async () => {
      noAuthTwin = new GmailTwinServer({ port: 9018, disableAuth: true });
      await noAuthTwin.start();
    });
    afterAll(async () => {
      await noAuthTwin.stop();
    });

    it('should allow sending emails without Authorization header', async () => {
      const rawEmail = buildRawEmail({
        to: 'recipient@example.com',
        from: 'sender@example.com',
        subject: 'No Auth Test',
        text: 'No auth',
      });
      const res = await fetch(
        `${noAuthTwin.getEmulatorHost()}/gmail/v1/users/me/messages/send`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ raw: rawEmail }),
        }
      );
      expect(res.status).toBe(200);
    });
  });
});
