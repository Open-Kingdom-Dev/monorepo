import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { YoutubeErrorModeStateDto } from '@open-kingdom/shared-backend-feature-youtube';

export class YouTubeTwinStatusDto {
  @ApiProperty({
    description: 'Whether the YouTube twin emulator is currently running',
    example: true,
  })
  running?: boolean;

  @ApiProperty({
    description: 'Whether the YouTube twin emulator is healthy',
    example: true,
  })
  healthy?: boolean;

  @ApiProperty({
    description: 'The port the YouTube twin emulator is listening on',
    example: 9016,
  })
  port?: number;

  @ApiPropertyOptional({
    description: 'The URL of the YouTube twin emulator',
    example: 'http://localhost:9016',
  })
  url?: string;

  @ApiProperty({
    description: 'Current YouTube error simulation mode state',
    type: YoutubeErrorModeStateDto,
  })
  errorMode?: YoutubeErrorModeStateDto;
}

export class YouTubeTwinStartResponseDto {
  @ApiProperty({ example: true })
  success?: boolean;

  @ApiProperty({ example: 'YouTube twin started on port 9016' })
  message?: string;

  @ApiPropertyOptional({ example: 'http://localhost:9016' })
  url?: string;
}

export class YouTubeTwinStopResponseDto {
  @ApiProperty({ example: true })
  success?: boolean;

  @ApiProperty({ example: 'YouTube twin stopped' })
  message?: string;
}
