import { GcsTwin } from '../gcs-twin.js';

describe('GcsTwin (skeleton)', () => {
  it('should be constructible with no arguments', () => {
    const twin = new GcsTwin();
    expect(twin).toBeInstanceOf(GcsTwin);
  });

  it('should accept config overrides', () => {
    const twin = new GcsTwin({ port: 9012 });
    expect(twin.getEmulatorHost()).toBe('http://localhost:9012');
  });

  it('should have start method', () => {
    const twin = new GcsTwin();
    expect(typeof twin.start).toBe('function');
  });

  it('should have stop method', () => {
    const twin = new GcsTwin();
    expect(typeof twin.stop).toBe('function');
  });

  it('should have reset method', () => {
    const twin = new GcsTwin();
    expect(typeof twin.reset).toBe('function');
  });

  it('should have isHealthy method', () => {
    const twin = new GcsTwin();
    expect(typeof twin.isHealthy).toBe('function');
  });

  it('should have getEmulatorHost method', () => {
    const twin = new GcsTwin();
    expect(typeof twin.getEmulatorHost).toBe('function');
  });
});
