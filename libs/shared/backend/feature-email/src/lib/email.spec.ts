// Mock dependencies before imports to avoid circular dependency issues
jest.mock('./email.service.js', () => ({ EmailService: jest.fn() }));
jest.mock('./email.controller.js', () => ({ EmailController: jest.fn() }));
jest.mock('./providers/gmail.provider.js', () => ({
  GmailProvider: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({ messageId: 'test-123' }),
  })),
}));

import { EmailModule } from './email.js';

describe('EmailModule', () => {
  const gmailConfig = {
    clientEmail: 'test@example.com',
    privateKey: '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----',
    impersonateEmail: 'sender@example.com',
  };

  it('configures module with gmail provider', () => {
    const result = EmailModule.forRoot({
      provider: 'gmail',
      config: gmailConfig,
    });

    expect(result.module).toBe(EmailModule);
    expect(result.controllers).toHaveLength(1);
    expect(result.providers).toHaveLength(2);
    expect(result.exports).toHaveLength(1);
  });
});
