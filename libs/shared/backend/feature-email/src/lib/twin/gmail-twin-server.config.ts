import {
  ConfigService,
  nodeEnvAdapter,
} from '@open-kingdom/shared-poly-util-env-config';
import { DEFAULT_PORTS, ENV_VARS, PORT_RANGE } from './constants.js';

export interface GmailTwinConfig {
  port: number;
  externalUrl: string;
  disableAuth: boolean;
}

export const defaultGmailConfig: GmailTwinConfig = {
  port: DEFAULT_PORTS.GMAIL,
  externalUrl: `http://localhost:${DEFAULT_PORTS.GMAIL}`,
  disableAuth: true,
};

const _CONFIG_ENV_KEYS = [
  ENV_VARS.GMAIL_TWIN_PORT,
  ENV_VARS.GMAIL_TWIN_DISABLE_AUTH,
] as const;

function createEnvConfigService(): ConfigService<
  (typeof _CONFIG_ENV_KEYS)[number]
> {
  return new ConfigService(nodeEnvAdapter);
}

function parseOptionalInt(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

export function createGmailConfig(
  overrides: Partial<GmailTwinConfig> = {}
): GmailTwinConfig {
  const env = createEnvConfigService();

  const envPort = parseOptionalInt(env.get(ENV_VARS.GMAIL_TWIN_PORT));
  const envDisableAuthVal = env.get(ENV_VARS.GMAIL_TWIN_DISABLE_AUTH);
  const envDisableAuth =
    envDisableAuthVal !== undefined ? envDisableAuthVal !== 'false' : undefined;

  const baseConfig: GmailTwinConfig = {
    ...defaultGmailConfig,
    ...(envPort !== undefined && { port: envPort }),
    ...(envDisableAuth !== undefined && { disableAuth: envDisableAuth }),
  };

  const finalConfig: GmailTwinConfig = {
    ...baseConfig,
    ...overrides,
  };

  if (finalConfig.port < PORT_RANGE.min || finalConfig.port > PORT_RANGE.max) {
    throw new Error(
      `Gmail twin port ${finalConfig.port} is outside the reserved range ${PORT_RANGE.min}-${PORT_RANGE.max}.`
    );
  }

  if (
    !overrides.externalUrl &&
    finalConfig.externalUrl === defaultGmailConfig.externalUrl
  ) {
    finalConfig.externalUrl = `http://localhost:${finalConfig.port}`;
  }

  return finalConfig;
}
