/**
 * GCS twin configuration.
 *
 * Re‑exports the shared GcsTwinConfig and BucketSeedConfig interfaces
 * along with the default configuration.
 */

export type { GcsTwinConfig, BucketSeedConfig } from '../shared/config.js';
export { defaultGcsConfig } from '../shared/config.js';
