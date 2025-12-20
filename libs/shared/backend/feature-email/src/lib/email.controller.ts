import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { EmailService } from './email.service.js';
import { SendEmailDto, SendEmailResponseDto } from './email.dto.js';

@ApiTags('Email')
@Controller('email')
export class EmailController {
  constructor(private emailService: EmailService) {}

  @ApiOperation({
    summary: 'Send test email',
    description: 'Send a test email via Gmail API',
  })
  @ApiBody({
    type: SendEmailDto,
    description: 'Email details',
    examples: {
      test: {
        summary: 'Test email',
        value: {
          to: 'test@example.com',
          subject: 'Test Subject',
          body: 'Hello, this is a test email.',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Email sent successfully',
    type: SendEmailResponseDto,
  })
  @Post('send')
  async sendEmail(@Body() dto: SendEmailDto): Promise<SendEmailResponseDto> {
    return this.emailService.send(dto);
  }
}
