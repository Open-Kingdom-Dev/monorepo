import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GoogleEmulatorStatusDto {
  @ApiProperty({
    description: 'Indicates whether the Google emulator server is running',
    example: true,
  })
  running!: boolean;

  @ApiProperty({
    description: 'Indicates whether the Google emulator server is healthy',
    example: true,
  })
  healthy!: boolean;

  @ApiProperty({
    description: 'Port on which the emulator is listening',
    example: 9015,
  })
  port!: number;

  @ApiPropertyOptional({
    description: 'Base URL of the running emulator',
    example: 'http://localhost:9015',
  })
  url?: string;
}

export class GoogleOAuthTokensDto {
  @ApiProperty({
    description: 'Google OAuth Access Token',
    example: 'ya29.a0AfH6SM...',
  })
  access_token!: string;

  @ApiProperty({
    description: 'Google OIDC ID Token',
    example: 'eyJhbGciOiJSUzI1Ni...',
  })
  id_token!: string;

  @ApiPropertyOptional({
    description: 'Google OAuth Refresh Token',
    example: '1//0g...',
  })
  refresh_token?: string;

  @ApiProperty({
    description: 'Token expiration duration in seconds',
    example: 3600,
  })
  expires_in!: number;

  @ApiProperty({ description: 'Token type', example: 'Bearer' })
  token_type!: string;

  @ApiProperty({
    description: 'Granted scopes',
    example: 'openid profile email',
  })
  scope!: string;
}

export class GoogleUserProfileDto {
  @ApiProperty({
    description: 'Subject / User ID',
    example: '100000000000000000001',
  })
  sub!: string;

  @ApiProperty({
    description: 'User email address',
    example: 'testuser@example.com',
  })
  email!: string;

  @ApiProperty({ description: 'Full name of the user', example: 'Test User' })
  name!: string;

  @ApiProperty({
    description: 'Profile picture URL',
    example: 'https://lh3.googleusercontent.com/a/default-user',
  })
  picture!: string;

  @ApiProperty({
    description: 'Whether the email address has been verified',
    example: true,
  })
  email_verified!: boolean;

  @ApiPropertyOptional({
    description: 'Hosted domain if applicable',
    example: 'example.com',
  })
  hd?: string;
}

export class ApiLogEntryDto {
  @ApiProperty({ description: 'Unique log ID', example: 'log_1721640000000' })
  id!: string;

  @ApiProperty({
    description: 'ISO Timestamp',
    example: '2026-07-22T09:15:00.000Z',
  })
  timestamp!: string;

  @ApiProperty({ description: 'HTTP Method', example: 'POST' })
  method!: string;

  @ApiProperty({
    description: 'Request URL',
    example: 'http://localhost:9015/token',
  })
  url!: string;

  @ApiProperty({ description: 'HTTP Response Status Code', example: 200 })
  statusCode!: number;

  @ApiProperty({ description: 'Request headers object' })
  requestHeaders!: Record<string, string>;

  @ApiPropertyOptional({ description: 'Request body' })
  requestBody?: string;

  @ApiProperty({ description: 'Response headers object' })
  responseHeaders!: Record<string, string>;

  @ApiProperty({ description: 'Response body payload' })
  responseBody!: string;

  @ApiProperty({ description: 'Latency in milliseconds', example: 15 })
  latencyMs!: number;
}

export class GoogleOAuthResultDto {
  @ApiProperty({ type: GoogleOAuthTokensDto })
  tokens!: GoogleOAuthTokensDto;

  @ApiProperty({ type: GoogleUserProfileDto })
  userProfile!: GoogleUserProfileDto;

  @ApiProperty({ type: [ApiLogEntryDto] })
  apiLogs!: ApiLogEntryDto[];
}
