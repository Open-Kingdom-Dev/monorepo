import { Injectable, Inject } from '@nestjs/common';
import { EMAIL_PROVIDER } from './email.types.js';
import type { EmailProvider } from './email.types.js';
import { SendEmailDto, SendEmailResponseDto } from './email.dto.js';

@Injectable()
export class EmailService {
  constructor(
    @Inject(EMAIL_PROVIDER) private readonly emailProvider: EmailProvider
  ) {}

  async send(dto: SendEmailDto): Promise<SendEmailResponseDto> {
    try {
      const result = await this.emailProvider.send({
        to: [dto.to],
        subject: dto.subject,
        text: dto.body,
      });
      return { success: true, messageId: result.messageId };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  }
}
