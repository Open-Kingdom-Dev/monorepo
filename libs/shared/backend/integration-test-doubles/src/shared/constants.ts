/**
 * Shared constants for integration‑test‑doubles library.
 */

/**
 * Port range reserved for twin emulators.
 * Twins should use fixed ports within this range to avoid collisions.
 */
export const PORT_RANGE = {
  min: 9010,
  max: 9020,
} as const;

/**
 * Default port assignments for each twin.
 */
export const DEFAULT_PORTS = {
  /** Google Cloud Storage twin */
  GCS: 9013,
  /** Gmail/Google Workspace Email twin (future) */
  GMAIL: 9014,
  /** Google Auth twin (future) */
  GOOGLE_AUTH: 9015,
  /** YouTube twin (future) */
  YOUTUBE: 9016,
  /** Google Calendar twin (future) */
  GOOGLE_CALENDAR: 9017,
  /** Spotify twin (future) */
  SPOTIFY: 9018,
} as const;

/**
 * Environment variable names used by the library.
 */
export const ENV_VARS = {
  /** Activation gate — must be 'true' for twins to start */
  TEST_MODE: 'TEST_MODE',
  /** GCS twin port override */
  GCS_TWIN_PORT: 'GCS_TWIN_PORT',
  /** GCS twin persistent data directory (optional) */
  GCS_TWIN_DATA_DIR: 'GCS_TWIN_DATA_DIR',
  /** Gmail twin port override */
  GMAIL_TWIN_PORT: 'GMAIL_TWIN_PORT',
  /** YouTube twin port override */
  YOUTUBE_TWIN_PORT: 'YOUTUBE_TWIN_PORT',
} as const;
