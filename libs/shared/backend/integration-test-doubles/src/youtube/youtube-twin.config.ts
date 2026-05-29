import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  ConfigService,
  nodeEnvAdapter,
} from '@open-kingdom/shared-poly-util-env-config';
import { DEFAULT_PORTS, ENV_VARS, PORT_RANGE } from '../shared/constants.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

// Resolved relative to dist/youtube/youtube-twin.config.js when packaged
const defaultAssetDir = path.resolve(currentDir, '../../test-assets/youtube');

export interface YoutubeTwinConfig {
  /** Port the YouTube twin Express server listens on */
  port: number;
  /** External URL consumers use to reach the twin */
  externalUrl: string;
  /** Path to the sample video file */
  sampleVideoPath: string;
  /** Path to the thumbnails directory */
  thumbnailDir: string;
}

export const defaultYoutubeConfig: YoutubeTwinConfig = {
  port: DEFAULT_PORTS.YOUTUBE,
  externalUrl: `http://localhost:${DEFAULT_PORTS.YOUTUBE}`,
  sampleVideoPath: path.join(defaultAssetDir, 'sample.mp4'),
  thumbnailDir: path.join(defaultAssetDir, 'thumbnails'),
};

export function createYoutubeConfig(
  overrides: Partial<YoutubeTwinConfig> = {}
): YoutubeTwinConfig {
  const env = new ConfigService(nodeEnvAdapter);
  const envPortVal = env.get(ENV_VARS.YOUTUBE_TWIN_PORT);
  const envPort = envPortVal ? Number.parseInt(envPortVal, 10) : undefined;

  const baseConfig: YoutubeTwinConfig = {
    ...defaultYoutubeConfig,
    ...(envPort !== undefined && !Number.isNaN(envPort) && { port: envPort }),
  };

  const finalConfig: YoutubeTwinConfig = {
    ...baseConfig,
    ...overrides,
  };

  if (finalConfig.port < PORT_RANGE.min || finalConfig.port > PORT_RANGE.max) {
    throw new Error(
      `YouTube twin port ${finalConfig.port} is outside the reserved range ` +
        `${PORT_RANGE.min}–${PORT_RANGE.max}.`
    );
  }

  if (
    !overrides.externalUrl &&
    finalConfig.externalUrl === defaultYoutubeConfig.externalUrl
  ) {
    finalConfig.externalUrl = `http://localhost:${finalConfig.port}`;
  }

  return finalConfig;
}
