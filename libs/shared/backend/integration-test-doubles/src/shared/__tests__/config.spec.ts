import { createGcsConfig, defaultGcsConfig } from '../config.js';
import { DEFAULT_PORTS, ENV_VARS, PORT_RANGE } from '../constants.js';

describe('config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('defaultGcsConfig', () => {
    it('uses the default GCS port', () => {
      expect(defaultGcsConfig.port).toBe(DEFAULT_PORTS.GCS);
    });

    it('externalUrl matches the default port', () => {
      expect(defaultGcsConfig.externalUrl).toBe(
        `http://localhost:${DEFAULT_PORTS.GCS}`
      );
    });

    it('contains two buckets (app-assets and user-uploads)', () => {
      expect(defaultGcsConfig.buckets).toHaveLength(2);
      expect(defaultGcsConfig.buckets[0].name).toBe('app-assets');
      expect(defaultGcsConfig.buckets[1].name).toBe('user-uploads');
    });

    it('app-assets bucket has three seed files', () => {
      const appAssets = defaultGcsConfig.buckets[0];
      expect(appAssets.seedFiles).toEqual([
        'sample-image-1.jpg',
        'sample-image-2.png',
        'sample-text.txt',
      ]);
    });

    it('user-uploads bucket has no seed files', () => {
      const userUploads = defaultGcsConfig.buckets[1];
      expect(userUploads.seedFiles).toBeUndefined();
    });
  });

  describe('createGcsConfig', () => {
    it('returns the default config when no env vars or overrides', () => {
      const config = createGcsConfig();
      expect(config).toEqual(defaultGcsConfig);
    });

    describe('environment variable overrides', () => {
      it('overrides port via GCS_TWIN_PORT', () => {
        process.env[ENV_VARS.GCS_TWIN_PORT] = '9012';
        const config = createGcsConfig();
        expect(config.port).toBe(9012);
      });

      it('overrides seedDataDir via GCS_TWIN_SEED_DIR', () => {
        process.env[ENV_VARS.GCS_TWIN_SEED_DIR] = '/custom/seed/path';
        const config = createGcsConfig();
        expect(config.seedDataDir).toBe('/custom/seed/path');
      });

      it('sets optional dataDir via GCS_TWIN_DATA_DIR', () => {
        process.env[ENV_VARS.GCS_TWIN_DATA_DIR] = '/custom/data';
        const config = createGcsConfig();
        expect(config.dataDir).toBe('/custom/data');
      });

      it('ignores non‑numeric GCS_TWIN_PORT', () => {
        process.env[ENV_VARS.GCS_TWIN_PORT] = 'not-a-number';
        const config = createGcsConfig();
        expect(config.port).toBe(defaultGcsConfig.port);
      });

      it('updates externalUrl when port is changed via env var', () => {
        process.env[ENV_VARS.GCS_TWIN_PORT] = '9012';
        const config = createGcsConfig();
        expect(config.externalUrl).toBe('http://localhost:9012');
      });
    });

    describe('constructor overrides', () => {
      it('overrides port explicitly', () => {
        const config = createGcsConfig({ port: 9011 });
        expect(config.port).toBe(9011);
      });

      it('overrides seedDataDir explicitly', () => {
        const config = createGcsConfig({ seedDataDir: '/explicit/path' });
        expect(config.seedDataDir).toBe('/explicit/path');
      });

      it('overrides dataDir explicitly', () => {
        const config = createGcsConfig({ dataDir: '/explicit/data' });
        expect(config.dataDir).toBe('/explicit/data');
      });

      it('explicit override takes precedence over env var', () => {
        process.env[ENV_VARS.GCS_TWIN_PORT] = '9012';
        const config = createGcsConfig({ port: 9011 });
        expect(config.port).toBe(9011);
      });

      it('explicit externalUrl is preserved even when port changes', () => {
        process.env[ENV_VARS.GCS_TWIN_PORT] = '9012';
        const config = createGcsConfig({
          externalUrl: 'http://custom.host:1234',
        });
        expect(config.externalUrl).toBe('http://custom.host:1234');
        expect(config.port).toBe(9012);
      });
    });

    describe('validation', () => {
      it('throws if port is below reserved range', () => {
        expect(() => createGcsConfig({ port: PORT_RANGE.min - 1 })).toThrow(
          /outside the reserved range/
        );
      });

      it('throws if port is above reserved range', () => {
        expect(() => createGcsConfig({ port: PORT_RANGE.max + 1 })).toThrow(
          /outside the reserved range/
        );
      });

      it('allows port at the lower bound', () => {
        expect(() => createGcsConfig({ port: PORT_RANGE.min })).not.toThrow();
      });

      it('allows port at the upper bound', () => {
        expect(() => createGcsConfig({ port: PORT_RANGE.max })).not.toThrow();
      });

      it('throws if env var port is out of range', () => {
        process.env[ENV_VARS.GCS_TWIN_PORT] = (PORT_RANGE.max + 1).toString();
        expect(() => createGcsConfig()).toThrow(/outside the reserved range/);
      });
    });

    describe('edge cases', () => {
      it('handles empty string environment variable', () => {
        process.env[ENV_VARS.GCS_TWIN_SEED_DIR] = '';
        const config = createGcsConfig();
        expect(config.seedDataDir).toBe('');
      });

      it('handles undefined dataDir', () => {
        delete process.env[ENV_VARS.GCS_TWIN_DATA_DIR];
        const config = createGcsConfig();
        expect(config.dataDir).toBeUndefined();
      });
    });
  });
});
