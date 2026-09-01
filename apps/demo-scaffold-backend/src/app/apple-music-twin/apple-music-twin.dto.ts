import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AppleMusicTwinStatusDto {
  @ApiProperty({
    description: 'Whether the Apple Music twin emulator is currently running',
    example: true,
  })
  running?: boolean;

  @ApiProperty({
    description: 'Whether the Apple Music twin emulator is healthy',
    example: true,
  })
  healthy?: boolean;

  @ApiProperty({
    description: 'The port the Apple Music twin emulator is listening on',
    example: 9019,
  })
  port?: number;

  @ApiPropertyOptional({
    description: 'The URL of the Apple Music twin emulator',
    example: 'http://localhost:9019',
  })
  url?: string;

  @ApiProperty({
    description: 'Current Apple Music error simulation mode state',
  })
  errorMode?: {
    active: boolean;
    mode: string | null;
  };
}

export class AppleMusicTwinStartResponseDto {
  @ApiProperty({ example: true })
  success?: boolean;

  @ApiProperty({ example: 'Apple Music twin started on port 9019' })
  message?: string;

  @ApiPropertyOptional({ example: 'http://localhost:9019' })
  url?: string;
}

export class AppleMusicTwinStopResponseDto {
  @ApiProperty({ example: true })
  success?: boolean;

  @ApiProperty({ example: 'Apple Music twin stopped' })
  message?: string;
}

export class AppleMusicErrorModeStateDto {
  @ApiProperty({ example: 'unauthorized' })
  mode?: string;
}
