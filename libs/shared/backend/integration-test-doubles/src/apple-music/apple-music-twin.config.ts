import {
  ConfigService,
  nodeEnvAdapter,
} from '@open-kingdom/shared-poly-util-env-config';
import { DEFAULT_PORTS, ENV_VARS, PORT_RANGE } from '../shared/constants.js';

export interface AppleMusicTwinConfig {
  /** Port the Apple Music twin Express server listens on */
  port: number;
  /** External URL consumers use to reach the twin */
  externalUrl: string;
}

export const defaultAppleMusicConfig: AppleMusicTwinConfig = {
  port: DEFAULT_PORTS.APPLE_MUSIC,
  externalUrl: `http://localhost:${DEFAULT_PORTS.APPLE_MUSIC}`,
};

export function createAppleMusicConfig(
  overrides: Partial<AppleMusicTwinConfig> = {}
): AppleMusicTwinConfig {
  const env = new ConfigService(nodeEnvAdapter);
  const envPortVal = env.get(ENV_VARS.APPLE_MUSIC_TWIN_PORT);
  const envPort = envPortVal ? Number.parseInt(envPortVal, 10) : undefined;

  const baseConfig: AppleMusicTwinConfig = {
    ...defaultAppleMusicConfig,
    ...(envPort !== undefined && !Number.isNaN(envPort) && { port: envPort }),
  };

  const finalConfig: AppleMusicTwinConfig = {
    ...baseConfig,
    ...overrides,
  };

  if (finalConfig.port < PORT_RANGE.min || finalConfig.port > PORT_RANGE.max) {
    throw new Error(
      `Apple Music twin port ${finalConfig.port} is outside the reserved range ` +
        `${PORT_RANGE.min}–${PORT_RANGE.max}.`
    );
  }

  if (
    !overrides.externalUrl &&
    finalConfig.externalUrl === defaultAppleMusicConfig.externalUrl
  ) {
    finalConfig.externalUrl = `http://localhost:${finalConfig.port}`;
  }

  return finalConfig;
}
