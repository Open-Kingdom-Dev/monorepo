import { DEFAULT_PORTS, PORT_RANGE, ENV_VARS } from '../constants.js';

describe('constants', () => {
  describe('PORT_RANGE', () => {
    it('defines a reserved port range for twin emulators', () => {
      expect(PORT_RANGE.min).toBe(9010);
      expect(PORT_RANGE.max).toBe(9020);
    });
  });

  describe('DEFAULT_PORTS', () => {
    it('assigns GCS twin port 9013', () => {
      expect(DEFAULT_PORTS.GCS).toBe(9013);
    });

    it('assigns unique ports to each future twin', () => {
      const ports = Object.values(DEFAULT_PORTS);
      const uniquePorts = new Set(ports);
      expect(ports.length).toBe(uniquePorts.size);
    });

    it('all ports are within the reserved range', () => {
      for (const port of Object.values(DEFAULT_PORTS)) {
        expect(port).toBeGreaterThanOrEqual(PORT_RANGE.min);
        expect(port).toBeLessThanOrEqual(PORT_RANGE.max);
      }
    });
  });

  describe('ENV_VARS', () => {
    it('exports TEST_MODE variable name', () => {
      expect(ENV_VARS.TEST_MODE).toBe('TEST_MODE');
    });

    it('exports GCS twin environment variable names', () => {
      expect(ENV_VARS.GCS_TWIN_PORT).toBe('GCS_TWIN_PORT');
      expect(ENV_VARS.GCS_TWIN_SEED_DIR).toBe('GCS_TWIN_SEED_DIR');
      expect(ENV_VARS.GCS_TWIN_DATA_DIR).toBe('GCS_TWIN_DATA_DIR');
    });
  });
});
