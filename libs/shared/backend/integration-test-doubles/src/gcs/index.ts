/**
 * Public API for the GCS twin.
 */

export { GcsTwin } from './gcs-twin.js';
export type { GcsTwinConfig, BucketConfig } from './gcs-twin.config.js';
export { defaultGcsConfig } from './gcs-twin.config.js';

export {
  GcsErrorModeManager,
  extractBucketName,
  isUploadOperation,
  isGcsDataOperation,
} from './gcs-error-mode.js';
export type {
  GcsErrorModeType,
  GcsErrorModeConfig,
  GcsErrorSimulationResult,
  BucketNotFoundConfig,
  QuotaExceededConfig,
  PermissionDeniedConfig,
  IntermittentFailureConfig,
} from './gcs-error-mode.js';

export { GcsErrorSimulationInterceptor } from './gcs-error-simulation.interceptor.js';
