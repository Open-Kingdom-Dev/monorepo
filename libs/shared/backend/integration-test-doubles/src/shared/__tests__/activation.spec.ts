import { isTestMode } from '../activation.js';

describe('activation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('isTestMode', () => {
    it('returns false when TEST_MODE is undefined', () => {
      delete process.env.TEST_MODE;
      expect(isTestMode()).toBe(false);
    });

    it('returns false when TEST_MODE is empty string', () => {
      process.env.TEST_MODE = '';
      expect(isTestMode()).toBe(false);
    });

    it('returns false when TEST_MODE is "false"', () => {
      process.env.TEST_MODE = 'false';
      expect(isTestMode()).toBe(false);
    });

    it('returns false when TEST_MODE is "TRUE" (case mismatch)', () => {
      process.env.TEST_MODE = 'TRUE';
      expect(isTestMode()).toBe(false);
    });

    it('returns false when TEST_MODE is "true " (trailing space)', () => {
      process.env.TEST_MODE = 'true ';
      expect(isTestMode()).toBe(false);
    });

    it('returns true when TEST_MODE is exactly "true"', () => {
      process.env.TEST_MODE = 'true';
      expect(isTestMode()).toBe(true);
    });

    it('is case‑sensitive', () => {
      process.env.TEST_MODE = 'True';
      expect(isTestMode()).toBe(false);
    });
  });
});
