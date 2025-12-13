import { Test } from '@nestjs/testing';
import { EmailController } from './email.controller.js';
import { EmailService } from './email.service.js';

describe('EmailController', () => {
  let controller: EmailController;
  let mockEmailService: { send: jest.Mock };

  beforeEach(async () => {
    mockEmailService = { send: jest.fn() };

    const module = await Test.createTestingModule({
      controllers: [EmailController],
      providers: [{ provide: EmailService, useValue: mockEmailService }],
    }).compile();

    controller = module.get(EmailController);
  });

  it('sends email with provided details', async () => {
    const emailRequest = {
      to: 'recipient@example.com',
      subject: 'Welcome',
      body: 'Hello, welcome to our service.',
    };
    mockEmailService.send.mockResolvedValue({
      success: true,
      messageId: 'msg-123',
    });

    const result = await controller.sendEmail(emailRequest);

    expect(mockEmailService.send).toHaveBeenCalledWith(emailRequest);
    expect(result.success).toBe(true);
  });
});
