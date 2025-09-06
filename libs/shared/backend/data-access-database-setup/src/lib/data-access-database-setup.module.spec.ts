// import { Test } from '@nestjs/testing';
import { DatabaseSetupModule } from './data-access-database-setup.module';

describe('DatabaseSetupModule', () => {
  it('should be defined', () => {
    expect(DatabaseSetupModule).toBeDefined();
  });

  it('should create a dynamic module with register method', () => {
    const mockSchema = {
      users: { name: 'users' },
      posts: { name: 'posts' },
    };

    const dynamicModule = DatabaseSetupModule.register({
      schema: mockSchema,
      filename: 'test.db',
    });

    expect(dynamicModule).toBeDefined();
    expect(dynamicModule.module).toBe(DatabaseSetupModule);
    expect(dynamicModule.imports).toBeDefined();
  });

  it('should use default values when options are not provided', () => {
    const mockSchema = { users: { name: 'users' } };

    const dynamicModule = DatabaseSetupModule.register({
      schema: mockSchema,
    });

    expect(dynamicModule).toBeDefined();
    expect(dynamicModule.imports).toBeDefined();
  });
});
