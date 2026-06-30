import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const YOUTUBE_ERROR_MODE_TYPES = [
  'daily-limit-exceeded',
  'invalid-api-key',
  'empty-results',
  'player-error-2',
  'player-error-5',
  'player-error-100',
  'player-error-101',
  'player-error-150',
] as const;

/**
 * Valid YouTube error mode types.
 */
export type YoutubeErrorModeType = (typeof YOUTUBE_ERROR_MODE_TYPES)[number];

/**
 * DTO for activating a YouTube error mode.
 */
export class YoutubeActivateErrorModeDto {
  @ApiProperty({
    description: 'The YouTube error mode to activate',
    enum: YOUTUBE_ERROR_MODE_TYPES,
    enumName: 'YoutubeErrorModeType',
    example: 'daily-limit-exceeded',
  })
  type?: YoutubeErrorModeType;
}

/**
 * Error mode state returned as part of the twin status response.
 */
export class YoutubeErrorModeStateDto {
  @ApiProperty({
    description: 'Whether an error mode is currently active',
    example: true,
  })
  active?: boolean;

  @ApiPropertyOptional({
    description: 'The active error mode type',
    enum: YOUTUBE_ERROR_MODE_TYPES,
    enumName: 'YoutubeErrorModeType',
  })
  type?: YoutubeErrorModeType | null;

  @ApiPropertyOptional({
    description: 'Human-readable description of what the error mode does',
    type: 'string',
  })
  description?: string | null;
}
