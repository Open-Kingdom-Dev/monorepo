import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ErrorModeStateDto } from '@open-kingdom/shared-backend-feature-gcp-resources';

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
    description: 'Current error simulation mode state',
    type: ErrorModeStateDto,
  })
  errorMode?: ErrorModeStateDto;
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
