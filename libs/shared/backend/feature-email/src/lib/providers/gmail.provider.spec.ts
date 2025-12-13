import { GmailProvider, GmailProviderConfig } from './gmail.provider.js';

// Mock @googleapis/gmail
jest.mock('@googleapis/gmail', () => ({
  gmail: jest.fn().mockReturnValue({
    users: {
      messages: {
        send: jest.fn(),
      },
    },
  }),
  auth: {
    JWT: jest.fn().mockImplementation(() => ({})),
  },
}));

describe('GmailProvider', () => {
  const config: GmailProviderConfig = {
    clientEmail: 'test@project.iam.gserviceaccount.com',
    privateKey: '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----',
    impersonateEmail: 'sender@example.com',
  };

  let provider: GmailProvider;
  let mockSend: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    const { gmail } = jest.requireMock('@googleapis/gmail');
    mockSend = gmail().users.messages.send;
    provider = new GmailProvider(config);
  });

  describe('authentication', () => {
    it('authenticates with gmail send scope', () => {
      const { auth } = jest.requireMock('@googleapis/gmail');
      expect(auth.JWT).toHaveBeenCalledWith({
        email: config.clientEmail,
        key: config.privateKey,
        scopes: ['https://www.googleapis.com/auth/gmail.send'],
        subject: config.impersonateEmail,
      });
    });

    it('converts escaped newlines in private key', () => {
      const escapedConfig: GmailProviderConfig = {
        ...config,
        privateKey:
          '-----BEGIN PRIVATE KEY-----\\ntest\\n-----END PRIVATE KEY-----',
      };
      new GmailProvider(escapedConfig);

      const { auth } = jest.requireMock('@googleapis/gmail');
      expect(auth.JWT).toHaveBeenLastCalledWith(
        expect.objectContaining({
          key: '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----',
        })
      );
    });
  });

  describe('sending emails', () => {
    it('sends plain text email', async () => {
      mockSend.mockResolvedValue({ data: { id: 'msg-123' } });

      const result = await provider.send({
        to: ['recipient@example.com'],
        subject: 'Test Subject',
        text: 'Hello World',
      });

      expect(result).toEqual({ messageId: 'msg-123' });
    });

    it('sends HTML email', async () => {
      mockSend.mockResolvedValue({ data: { id: 'msg-456' } });

      const result = await provider.send({
        to: ['recipient@example.com'],
        subject: 'Test Subject',
        html: '<h1>Hello World</h1>',
      });

      expect(result).toEqual({ messageId: 'msg-456' });
    });

    it('sends to multiple recipients', async () => {
      mockSend.mockResolvedValue({ data: { id: 'msg-102' } });

      await provider.send({
        to: ['first@example.com', 'second@example.com'],
        subject: 'Test',
        text: 'Hello',
      });

      const call = mockSend.mock.calls[0][0];
      const rawDecoded = Buffer.from(call.requestBody.raw, 'base64').toString();
      expect(rawDecoded).toContain('To: first@example.com, second@example.com');
    });

    it('uses impersonate email as default sender', async () => {
      mockSend.mockResolvedValue({ data: { id: 'msg-789' } });

      await provider.send({
        to: ['recipient@example.com'],
        subject: 'Test',
        text: 'Hello',
      });

      const call = mockSend.mock.calls[0][0];
      const rawDecoded = Buffer.from(call.requestBody.raw, 'base64').toString();
      expect(rawDecoded).toContain(`From: ${config.impersonateEmail}`);
    });

    it('allows custom sender address', async () => {
      mockSend.mockResolvedValue({ data: { id: 'msg-101' } });

      await provider.send({
        to: ['recipient@example.com'],
        from: 'custom@example.com',
        subject: 'Test',
        text: 'Hello',
      });

      const call = mockSend.mock.calls[0][0];
      const rawDecoded = Buffer.from(call.requestBody.raw, 'base64').toString();
      expect(rawDecoded).toContain('From: custom@example.com');
    });

    it('returns undefined message ID when not provided by Gmail', async () => {
      mockSend.mockResolvedValue({ data: {} });

      const result = await provider.send({
        to: ['recipient@example.com'],
        subject: 'Test',
        text: 'Hello',
      });

      expect(result.messageId).toBeUndefined();
    });
  });
});
