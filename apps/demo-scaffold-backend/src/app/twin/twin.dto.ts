import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ErrorModeStateDto } from '@open-kingdom/shared-backend-feature-gcp-resources';

export class GmailTwinStatusDto {
  @ApiProperty({
    description: 'Whether the Gmail mock server is currently running',
    example: true,
  })
  running?: boolean;

  @ApiProperty({
    description: 'Whether the Gmail mock server is healthy',
    example: true,
  })
  healthy?: boolean;

  @ApiProperty({
    description: 'The port the Gmail mock server is listening on',
    example: 9014,
  })
  port?: number;

  @ApiPropertyOptional({
    description: 'The URL of the Gmail mock server',
    example: 'http://localhost:9014',
  })
  url?: string;
}

export class TwinStatusDto {
  @ApiProperty({
    description: 'Whether the twin emulator is currently running',
    example: true,
  })
  running?: boolean;

  @ApiProperty({
    description: 'Whether the twin emulator is healthy',
    example: true,
  })
  healthy?: boolean;

  @ApiProperty({
    description: 'The port the twin emulator is listening on',
    example: 9013,
  })
  port?: number;

  @ApiPropertyOptional({
    description: 'The URL of the twin emulator',
    example: 'http://localhost:9013',
  })
  url?: string;

  @ApiProperty({
    description: 'Whether GCS storage emulator is online',
    example: true,
  })
  gcsOnline?: boolean;

  @ApiProperty({
    description: 'Current error simulation mode state',
    type: ErrorModeStateDto,
  })
  errorMode?: ErrorModeStateDto;

  @ApiPropertyOptional({
    description: 'Status of the Gmail twin emulator',
    type: GmailTwinStatusDto,
  })
  gmail?: GmailTwinStatusDto;

  @ApiProperty({
    description: 'Whether the global fetch/HTTP request interceptor is active',
    example: true,
  })
  interceptorActive?: boolean;

  @ApiProperty({
    description:
      'Whether real Gmail credentials are fully configured in the environment',
    example: false,
  })
  realGmailConfigured?: boolean;
}

export class TwinStartResponseDto {
  @ApiProperty({ example: true })
  success?: boolean;

  @ApiProperty({ example: 'GCS twin started on port 9013' })
  message?: string;

  @ApiPropertyOptional({ example: 'http://localhost:9013' })
  url?: string;
}

export class TwinStopResponseDto {
  @ApiProperty({ example: true })
  success?: boolean;

  @ApiProperty({ example: 'GCS twin stopped' })
  message?: string;
}

export class GmailTwinCapturedEmailDto {
  @ApiProperty({
    description: 'The unique message identifier',
    example: 'msg-12345',
  })
  id?: string;

  @ApiProperty({
    description: 'The thread identifier of the message',
    example: 'thread-12345',
  })
  threadId?: string;

  @ApiProperty({
    description: 'List of recipient email addresses',
    type: [String],
    example: ['recipient@example.com'],
  })
  to?: string[];

  @ApiProperty({
    description: 'Sender email address',
    example: 'sender@example.com',
  })
  from?: string;

  @ApiProperty({
    description: 'Email subject line',
    example: 'Hello World',
  })
  subject?: string;

  @ApiPropertyOptional({
    description: 'Plaintext message content',
    example: 'This is the body text',
  })
  text?: string;

  @ApiPropertyOptional({
    description: 'HTML message content',
    example: '<p>This is the HTML body</p>',
  })
  html?: string;

  @ApiProperty({
    description: 'ISO timestamp when the email was captured',
    example: '2026-05-30T00:00:00.000Z',
  })
  timestamp?: string;

  @ApiProperty({
    description: 'The raw base64url encoded email package',
    example: 'base64url-encoded-message-content',
  })
  raw?: string;
}

export class GmailTwinResetResponseDto {
  @ApiProperty({ example: true })
  success?: boolean;

  @ApiProperty({ example: 'Gmail mailbox reset successfully' })
  message?: string;
}

export class SetGmailErrorModeDto {
  @ApiProperty({
    description: 'The simulated error mode to activate',
    enum: ['none', 'rate-limit', 'auth-error', 'bad-request'],
    example: 'rate-limit',
  })
  mode?: 'none' | 'rate-limit' | 'auth-error' | 'bad-request';
}

export class GmailTwinErrorModeResponseDto {
  @ApiProperty({ example: true })
  success?: boolean;

  @ApiProperty({ example: 'Gmail twin error mode configured to: rate-limit' })
  message?: string;
}
