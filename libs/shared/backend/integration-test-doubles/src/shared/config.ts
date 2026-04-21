import {
  ConfigService,
  nodeEnvAdapter,
} from '@open-kingdom/shared-poly-util-env-config';
import { DEFAULT_PORTS, ENV_VARS, PORT_RANGE } from './constants.js';

/**
 * Configuration for a single bucket to create on startup.
 */
export interface BucketConfig {
  /** Bucket name */
  name: string;
}

/**
 * Configuration for the GCS twin.
 */
export interface GcsTwinConfig {
  /** Port the fake‑gcs‑server listens on */
  port: number;
  /** External URL the SDK will connect to (e.g., http://localhost:9013) */
  externalUrl: string;
  /** Optional persistent data directory (if not set, data is ephemeral) */
  dataDir?: string;
  /** Buckets to create on startup */
  buckets: BucketConfig[];
}

/**
 * Default configuration for the GCS twin.
 *
 * Values are derived from the implementation guide (docs/replication‑engine/twins/01‑gcs‑twin.md).
 */
export const defaultGcsConfig: GcsTwinConfig = {
  port: DEFAULT_PORTS.GCS,
  externalUrl: `http://localhost:${DEFAULT_PORTS.GCS}`,
  buckets: [{ name: 'app-assets' }, { name: 'user-uploads' }],
};

/**
 * Environment‑variable keys that affect GCS twin configuration.
 */
const _CONFIG_ENV_KEYS = [
  ENV_VARS.GCS_TWIN_PORT,
  ENV_VARS.GCS_TWIN_DATA_DIR,
] as const;

/**
 * Creates a typed ConfigService for GCS twin environment variables.
 */
function createEnvConfigService(): ConfigService<
  (typeof _CONFIG_ENV_KEYS)[number]
> {
  return new ConfigService(nodeEnvAdapter);
}

/**
 * Parses a string environment variable as a number.
 * Returns undefined if the variable is not set or cannot be parsed.
 */
function parseOptionalInt(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

/**
 * Creates a GcsTwinConfig by merging defaults, environment variables, and explicit overrides.
 *
 * Environment variables take precedence over defaults.
 * Explicit overrides (passed as argument) take precedence over environment variables.
 *
 * @param overrides - Partial configuration that overrides both defaults and environment variables.
 * @returns A complete GcsTwinConfig.
 */
export function createGcsConfig(
  overrides: Partial<GcsTwinConfig> = {}
): GcsTwinConfig {
  const env = createEnvConfigService();

  // Environment‑variable overrides
  const envPort = parseOptionalInt(env.get(ENV_VARS.GCS_TWIN_PORT));
  const envDataDir = env.get(ENV_VARS.GCS_TWIN_DATA_DIR);

  const baseConfig: GcsTwinConfig = {
    ...defaultGcsConfig,
    ...(envPort !== undefined && { port: envPort }),
    ...(envDataDir !== undefined && { dataDir: envDataDir }),
  };

  // Explicit overrides take final precedence
  const finalConfig: GcsTwinConfig = {
    ...baseConfig,
    ...overrides,
  };

  // Validate port is within reserved range
  if (finalConfig.port < PORT_RANGE.min || finalConfig.port > PORT_RANGE.max) {
    throw new Error(
      `GCS twin port ${finalConfig.port} is outside the reserved range ${PORT_RANGE.min}‑${PORT_RANGE.max}. ` +
        `Adjust PORT_RANGE in constants.ts or set ${ENV_VARS.GCS_TWIN_PORT} appropriately.`
    );
  }

  // Ensure externalUrl matches the port (unless explicitly overridden)
  if (
    !overrides.externalUrl &&
    finalConfig.externalUrl === defaultGcsConfig.externalUrl
  ) {
    finalConfig.externalUrl = `http://localhost:${finalConfig.port}`;
  }

  return finalConfig;
}
