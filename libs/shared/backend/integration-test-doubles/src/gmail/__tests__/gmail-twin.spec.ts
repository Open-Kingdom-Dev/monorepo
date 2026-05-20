import { GmailTwin } from '../gmail-twin.js';
import { buildRawEmail } from '../test-utils.js';

describe('GmailTwin', () => {
  let twin: GmailTwin;

  beforeAll(async () => {
    twin = new GmailTwin({ port: 9014 });
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
    const unfilteredEmails = (await unfilteredRes.json()) as CapturedEmailJson[];
    expect(unfilteredEmails).toHaveLength(0);

    // Reset control plane
    const resetRes = await fetch(`${host}/test/gmail/reset`, {
      method: 'POST',
    });
    expect(resetRes.status).toBe(200);

    const afterResetRes = await fetch(`${host}/test/gmail/emails`);
    const afterResetEmails = (await afterResetRes.json()) as CapturedEmailJson[];
    expect(afterResetEmails).toHaveLength(0);
  });
});
