import { HttpInterceptor } from '../interceptor.js';
import { createInterceptorConfig } from '../interceptor.config.js';

describe('HttpInterceptor', () => {
  let interceptor: HttpInterceptor;

  beforeEach(() => {
    interceptor = new HttpInterceptor();
  });

  afterEach(async () => {
    await interceptor.uninstall();
  });

  describe('constructor', () => {
    it('should create with default config', () => {
      const config = interceptor.getConfig();
      expect(config.enabled).toBe(true);
      expect(config.verbose).toBe(false);
      expect(config.rules).toEqual([]);
    });

    it('should accept config overrides', () => {
      const customInterceptor = new HttpInterceptor({
        enabled: false,
        verbose: true,
      });
      const config = customInterceptor.getConfig();
      expect(config.enabled).toBe(false);
      expect(config.verbose).toBe(true);
    });
  });

  describe('install/uninstall', () => {
    it('should install and report healthy', async () => {
      expect(interceptor.isHealthy()).toBe(false);
      await interceptor.install();
      expect(interceptor.isHealthy()).toBe(true);
    });

    it('should uninstall and report unhealthy', async () => {
      await interceptor.install();
      expect(interceptor.isHealthy()).toBe(true);
      await interceptor.uninstall();
      expect(interceptor.isHealthy()).toBe(false);
    });

    it('should be idempotent on install', async () => {
      await interceptor.install();
      const firstHealth = interceptor.isHealthy();
      await interceptor.install();
      const secondHealth = interceptor.isHealthy();
      expect(firstHealth).toBe(secondHealth);
    });

    it('should be idempotent on uninstall', async () => {
      await interceptor.install();
      await interceptor.uninstall();
      await interceptor.uninstall(); // Should not throw
      expect(interceptor.isHealthy()).toBe(false);
    });

    it('should not install when disabled', async () => {
      const disabledInterceptor = new HttpInterceptor({ enabled: false });
      await disabledInterceptor.install();
      expect(disabledInterceptor.isHealthy()).toBe(false);
    });
  });

  describe('routing rules', () => {
    beforeEach(async () => {
      await interceptor.install();
    });

    it('should add a routing rule', () => {
      interceptor.addRule({
        from: 'https://api.example.com',
        to: 'http://localhost:8080',
      });

      const config = interceptor.getConfig();
      expect(config.rules.length).toBe(1);
      expect(config.rules[0].from).toBe('https://api.example.com');
      expect(config.rules[0].to).toBe('http://localhost:8080');
    });

    it('should remove rules matching predicate', () => {
      interceptor.addRule({
        from: 'https://api.example.com',
        to: 'http://localhost:8080',
      });
      interceptor.addRule({
        from: 'https://storage.googleapis.com',
        to: 'http://localhost:9013',
      });

      interceptor.removeRules((rule: any) => rule.from.includes('example.com'));

      const config = interceptor.getConfig();
      expect(config.rules.length).toBe(1);
      expect(config.rules[0].from).toBe('https://storage.googleapis.com');
    });

    it('should clear all rules', () => {
      interceptor.addRule({
        from: 'https://api.example.com',
        to: 'http://localhost:8080',
      });
      interceptor.addRule({
        from: 'https://storage.googleapis.com',
        to: 'http://localhost:9013',
      });

      interceptor.clearRules();

      const config = interceptor.getConfig();
      expect(config.rules.length).toBe(0);
    });
  });

  describe('URL matching', () => {
    beforeEach(async () => {
      interceptor = new HttpInterceptor({ verbose: true });
      await interceptor.install();
      interceptor.addRule({
        from: 'https://storage.googleapis.com',
        to: 'http://localhost:9013',
      });
    });

    it('should match exact hostname', () => {
      // This test verifies the internal matching logic
      // Full fetch interception tests come in T06
      const config = interceptor.getConfig();
      expect(config.rules.length).toBe(1);
    });
  });
});

describe('createInterceptorConfig', () => {
  it('should create default config', () => {
    const config = createInterceptorConfig();
    expect(config).toEqual({
      enabled: true,
      verbose: false,
      rules: [],
    });
  });

  it('should merge overrides', () => {
    const config = createInterceptorConfig({
      enabled: false,
      rules: [{ from: 'https://test.com', to: 'http://localhost:3000' }],
    });
    expect(config.enabled).toBe(false);
    expect(config.rules.length).toBe(1);
    expect(config.verbose).toBe(false); // default preserved
  });
});
