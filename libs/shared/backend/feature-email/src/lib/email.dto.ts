import { ApiProperty } from '@nestjs/swagger';

export class SendEmailDto {
  @ApiProperty({
    description: 'Recipient email address',
    example: 'recipient@example.com',
    format: 'email',
  })
  to!: string;

  @ApiProperty({
    description: 'Email subject line',
    example: 'Test Email Subject',
  })
  subject!: string;

  @ApiProperty({
    description: 'Email body content',
    example: 'Hello, this is a test email.',
  })
  body!: string;
}

export class SendEmailResponseDto {
  @ApiProperty({
    description: 'Whether the email was sent successfully',
    example: true,
  })
  success!: boolean;

  @ApiProperty({
    description: 'Gmail message ID if successful',
    example: '18c1234567890abc',
    required: false,
  })
  messageId?: string;

  @ApiProperty({
    description: 'Error message if failed',
    example: 'Invalid recipient address',
    required: false,
  })
  error?: string;
}
