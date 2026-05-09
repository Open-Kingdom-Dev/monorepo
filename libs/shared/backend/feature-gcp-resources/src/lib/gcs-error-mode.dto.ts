import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const GCS_ERROR_MODE_TYPES = [
  'bucket-not-found',
  'quota-exceeded',
  'permission-denied',
  'intermittent-failure',
] as const;

/**
 * Valid GCS error mode types.
 */
export type GcsErrorModeType = (typeof GCS_ERROR_MODE_TYPES)[number];

/**
 * DTO for activating a GCS error mode.
 */
export class ActivateErrorModeDto {
  @ApiProperty({
    description: 'The error mode to activate',
    enum: GCS_ERROR_MODE_TYPES,
    enumName: 'GcsErrorModeType',
    example: 'quota-exceeded',
  })
  type!: GcsErrorModeType;

  @ApiPropertyOptional({
    description:
      'Bucket name for bucket-not-found mode. Required when type is bucket-not-found.',
    example: 'app-assets',
  })
  bucketName?: string;

  @ApiPropertyOptional({
    description:
      'Fail every Nth request for intermittent-failure mode. Defaults to 2.',
    example: 3,
  })
  failEveryN?: number;
}

/**
 * Error mode state returned as part of the twin status response.
 * Kept minimal — the frontend only needs to know what's active and a human description.
 */
export class ErrorModeStateDto {
  @ApiProperty({
    description: 'Whether an error mode is currently active',
    example: true,
  })
  active!: boolean;

  @ApiPropertyOptional({
    description: 'The active error mode type',
    enum: GCS_ERROR_MODE_TYPES,
    enumName: 'GcsErrorModeType',
  })
  type?: GcsErrorModeType | null;

  @ApiPropertyOptional({
    description: 'Human-readable description of what the error mode does',
    type: 'string',
  })
  description?: string | null;
}
