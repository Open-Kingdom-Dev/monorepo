import { Test } from '@nestjs/testing';
import { EmailService } from './email.service.js';
import { EMAIL_PROVIDER } from './email.types.js';

describe('EmailService', () => {
  let service: EmailService;
  let mockProvider: { send: jest.Mock };

  beforeEach(async () => {
    mockProvider = { send: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: EMAIL_PROVIDER, useValue: mockProvider },
      ],
    }).compile();

    service = module.get(EmailService);
  });

  it('sends email and returns success with message ID', async () => {
    mockProvider.send.mockResolvedValue({ messageId: 'msg-123' });

    const result = await service.send({
      to: 'recipient@example.com',
      subject: 'Test Subject',
      body: 'Hello, this is a test.',
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBe('msg-123');
    expect(mockProvider.send).toHaveBeenCalledWith({
      to: ['recipient@example.com'],
      subject: 'Test Subject',
      text: 'Hello, this is a test.',
    });
  });

  it('returns error when email fails to send', async () => {
    mockProvider.send.mockRejectedValue(new Error('SMTP connection failed'));

    const result = await service.send({
      to: 'recipient@example.com',
      subject: 'Test',
      body: 'Test body',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('SMTP connection failed');
  });
});
