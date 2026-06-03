/**
 * Shared constants for the Gmail twin server.
 */

export const PORT_RANGE = {
  min: 9010,
  max: 9020,
} as const;

export const DEFAULT_PORTS = {
  GMAIL: 9014,
} as const;

export const ENV_VARS = {
  GMAIL_TWIN_PORT: 'GMAIL_TWIN_PORT',
  GMAIL_TWIN_DISABLE_AUTH: 'GMAIL_TWIN_DISABLE_AUTH',
} as const;

export const GMAIL_TWIN_PORT = Number(
  process.env[ENV_VARS.GMAIL_TWIN_PORT] || DEFAULT_PORTS.GMAIL
);

export const GMAIL_TWIN_CONFIG = Symbol('GMAIL_TWIN_CONFIG');
