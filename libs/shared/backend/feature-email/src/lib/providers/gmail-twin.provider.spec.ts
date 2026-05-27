import {
  GmailTwinProvider,
  SimulatedGmailError,
} from './gmail-twin.provider.js';

describe('GmailTwinProvider', () => {
  let provider: GmailTwinProvider;

  beforeEach(() => {
    provider = new GmailTwinProvider();
  });

  describe('sending emails', () => {
    it('sends email successfully and generates messageId and threadId', async () => {
      const result = await provider.send({
        to: ['recipient@example.com'],
        subject: 'Test Subject',
        text: 'Hello World',
      });

      expect(result.messageId).toBeDefined();
      expect(result.messageId).toMatch(/^msg-/);

      const emails = provider.getEmails();
      expect(emails).toHaveLength(1);
      expect(emails[0]).toEqual(
        expect.objectContaining({
          id: result.messageId,
          to: ['recipient@example.com'],
          subject: 'Test Subject',
          text: 'Hello World',
          from: 'sender@example.com',
        })
      );
    });

    it('preserves fields like html and custom from address', async () => {
      await provider.send({
        to: ['user1@example.com'],
        from: 'custom@example.com',
        subject: 'HTML Subject',
        html: '<p>HTML body</p>',
      });

      const emails = provider.getEmails();
      expect(emails[0].from).toBe('custom@example.com');
      expect(emails[0].html).toBe('<p>HTML body</p>');
      expect(emails[0].text).toBeUndefined();
    });

    it('stores sent emails in LIFO order', async () => {
      await provider.send({
        to: ['recipient1@example.com'],
        subject: 'First',
      });
      await provider.send({
        to: ['recipient2@example.com'],
        subject: 'Second',
      });

      const emails = provider.getEmails();
      expect(emails).toHaveLength(2);
      expect(emails[0].subject).toBe('Second');
      expect(emails[1].subject).toBe('First');
    });

    it('filters emails by recipient address (case-insensitive)', async () => {
      await provider.send({
        to: ['userA@example.com', 'userB@example.com'],
        subject: 'Email 1',
      });
      await provider.send({
        to: ['userC@example.com'],
        subject: 'Email 2',
      });

      const queryA = provider.getEmails('usera@example.com');
      expect(queryA).toHaveLength(1);
      expect(queryA[0].subject).toBe('Email 1');

      const queryC = provider.getEmails('USERC@EXAMPLE.COM');
      expect(queryC).toHaveLength(1);
      expect(queryC[0].subject).toBe('Email 2');

      const queryD = provider.getEmails('userD@example.com');
      expect(queryD).toHaveLength(0);
    });
  });

  describe('reset and clear', () => {
    it('clears all emails via clear()', async () => {
      await provider.send({ to: ['recipient@example.com'], subject: 'Test' });
      expect(provider.getEmails()).toHaveLength(1);

      provider.clear();
      expect(provider.getEmails()).toHaveLength(0);
    });

    it('resets email store and active error mode via reset()', async () => {
      provider.setErrorMode('rate-limit');
      await provider
        .send({ to: ['recipient@example.com'], subject: 'Test' })
        .catch(() => {
          // Expected rate-limit error, store remains empty
        });
      expect(provider.getEmails()).toHaveLength(0);

      provider.reset();
      expect(provider.getErrorMode()).toBeNull();

      const result = await provider.send({
        to: ['recipient@example.com'],
        subject: 'Test',
      });
      expect(result.messageId).toBeDefined();
      expect(provider.getEmails()).toHaveLength(1);
    });
  });

  describe('error simulation', () => {
    it('simulates 403 Forbidden insufficient-permissions', async () => {
      provider.setErrorMode('insufficient-permissions');
      expect(provider.getErrorMode()).toBe('insufficient-permissions');

      await expect(
        provider.send({ to: ['recipient@example.com'], subject: 'Test' })
      ).rejects.toThrow('Insufficient Permission');

      try {
        await provider.send({ to: ['recipient@example.com'], subject: 'Test' });
      } catch (err) {
        const error = err as SimulatedGmailError;
        expect(error.code).toBe(403);
        expect(error.status).toBe(403);
        expect(error.response?.data.error.code).toBe(403);
        expect(error.response?.data.error.errors[0].reason).toBe(
          'insufficientPermissions'
        );
      }
    });

    it('simulates 429 Too Many Requests rate-limit with retry-after header', async () => {
      provider.setErrorMode('rate-limit');

      try {
        await provider.send({ to: ['recipient@example.com'], subject: 'Test' });
      } catch (err) {
        const error = err as SimulatedGmailError;
        expect(error.code).toBe(429);
        expect(error.status).toBe(429);
        expect(error.response?.headers['retry-after']).toBe('60');
        expect(error.response?.data.error.code).toBe(429);
        expect(error.response?.data.error.errors[0].reason).toBe(
          'userRateLimitExceeded'
        );
      }
    });

    it('simulates 400 Bad Request invalid-recipient', async () => {
      provider.setErrorMode('invalid-recipient');

      try {
        await provider.send({ to: ['recipient@example.com'], subject: 'Test' });
      } catch (err) {
        const error = err as SimulatedGmailError;
        expect(error.code).toBe(400);
        expect(error.status).toBe(400);
        expect(error.response?.data.error.code).toBe(400);
        expect(error.response?.data.error.errors[0].reason).toBe(
          'invalidArgument'
        );
      }
    });
  });
});
