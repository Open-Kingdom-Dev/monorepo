/**
 * GCS twin configuration.
 *
 * Re‑exports the shared GcsTwinConfig and BucketConfig interfaces
 * along with the default configuration.
 */

export type { GcsTwinConfig, BucketConfig } from '../shared/config.js';
export { defaultGcsConfig } from '../shared/config.js';
