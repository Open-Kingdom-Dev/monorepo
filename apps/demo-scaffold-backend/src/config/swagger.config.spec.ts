import { createSwaggerConfig, globalPrefix } from './swagger.config';

describe('swagger.config', () => {
  it('should export globalPrefix', () => {
    expect(globalPrefix).toBe('api');
  });

  it('should create swagger config', () => {
    const config = createSwaggerConfig();
    expect(config).toBeDefined();
    const built = config.build();
    expect(built.info.title).toBe('Demo scaffold API');
    expect(built.info.version).toBe('1.0');
  });
});
