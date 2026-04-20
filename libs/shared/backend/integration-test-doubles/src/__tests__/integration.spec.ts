import { DEFAULT_PORTS, PORT_RANGE, ENV_VARS } from '../shared/constants.js';
import { isTestMode } from '../shared/activation.js';
import { createGcsConfig, defaultGcsConfig } from '../shared/config.js';

describe('integration smoke test', () => {
  describe('constants', () => {
    it('exports PORT_RANGE', () => {
      expect(PORT_RANGE.min).toBe(9010);
      expect(PORT_RANGE.max).toBe(9020);
    });

    it('exports DEFAULT_PORTS with GCS port', () => {
      expect(DEFAULT_PORTS.GCS).toBe(9013);
    });

    it('exports ENV_VARS with expected keys', () => {
      expect(ENV_VARS.TEST_MODE).toBe('TEST_MODE');
      expect(ENV_VARS.GCS_TWIN_PORT).toBe('GCS_TWIN_PORT');
    });
  });

  describe('activation', () => {
    it('exports isTestMode function', () => {
      expect(typeof isTestMode).toBe('function');
    });
  });

  describe('config', () => {
    it('exports defaultGcsConfig', () => {
      expect(defaultGcsConfig.port).toBe(9013);
      expect(defaultGcsConfig.buckets).toHaveLength(2);
    });

    it('exports createGcsConfig function', () => {
      const config = createGcsConfig();
      expect(config.port).toBe(9013);
    });
  });
});
