import {
  ConfigService,
  createConfigService,
  createBrowserEnvAdapter,
  nodeEnvAdapter,
  EnvAdapter,
} from './config-service.js';

describe('ConfigService', () => {
  describe('with nodeEnvAdapter', () => {
    const envKeys = ['NODE_ENV', 'UNKNOWN_KEY'] as const;
    const configService = createConfigService(envKeys, nodeEnvAdapter);

    describe('get', () => {
      it('should return undefined when env var is not set and no default provided', () => {
        expect(configService.get('UNKNOWN_KEY')).toBeUndefined();
      });

      it('should return provided default when env var is not set', () => {
        expect(configService.get('UNKNOWN_KEY', 'fallback')).toBe('fallback');
      });

      it('should return env value over provided default', () => {
        const nodeEnv = process.env['NODE_ENV'];
        if (nodeEnv) {
          expect(configService.get('NODE_ENV', 'fallback')).toBe(nodeEnv);
        }
      });
    });

    describe('getOrThrow', () => {
      it('should throw when env var is not set', () => {
        expect(() => configService.getOrThrow('UNKNOWN_KEY')).toThrow(
          'Environment variable UNKNOWN_KEY is not set'
        );
      });

      it('should return value when env var is set', () => {
        const nodeEnv = process.env['NODE_ENV'];
        if (nodeEnv) {
          expect(configService.getOrThrow('NODE_ENV')).toBe(nodeEnv);
        }
      });
    });

    describe('has', () => {
      it('should return false for unset keys', () => {
        expect(configService.has('UNKNOWN_KEY')).toBe(false);
      });

      it('should return true for set keys', () => {
        if (process.env['NODE_ENV']) {
          expect(configService.has('NODE_ENV')).toBe(true);
        }
      });
    });
  });

  describe('with custom adapter', () => {
    const mockEnv: Record<string, string> = {
      CUSTOM_VAR: 'custom-value',
    };

    const customAdapter: EnvAdapter = {
      get: (key) => mockEnv[key],
    };

    const envKeys = ['CUSTOM_VAR', 'MISSING_VAR'] as const;
    const configService = createConfigService(envKeys, customAdapter);

    it('should use the custom adapter to get values', () => {
      expect(configService.get('CUSTOM_VAR')).toBe('custom-value');
    });

    it('should return undefined for missing keys', () => {
      expect(configService.get('MISSING_VAR')).toBeUndefined();
    });
  });

  describe('ConfigService class', () => {
    it('should allow creating instances directly', () => {
      const adapter: EnvAdapter = { get: () => 'test' };
      const service = new ConfigService<'TEST'>(adapter);
      expect(service.get('TEST')).toBe('test');
    });
  });

  describe('createBrowserEnvAdapter', () => {
    it('should create an adapter that reads from the provided import.meta', () => {
      const mockImportMeta = {
        env: {
          VITE_API_URL: 'https://api.example.com',
          VITE_APP_NAME: 'TestApp',
        },
      };

      const adapter = createBrowserEnvAdapter(mockImportMeta);
      const envKeys = [
        'VITE_API_URL',
        'VITE_APP_NAME',
        'VITE_MISSING',
      ] as const;
      const configService = createConfigService(envKeys, adapter);

      expect(configService.get('VITE_API_URL')).toBe('https://api.example.com');
      expect(configService.get('VITE_APP_NAME')).toBe('TestApp');
      expect(configService.get('VITE_MISSING')).toBeUndefined();
    });
  });
});
