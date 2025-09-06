import { Test, TestingModule } from '@nestjs/testing';

import { AppModule } from './app.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

jest.mock('@ynaa/demo-scaffold-backend-feature-root-schema', () => ({
  YnaaFeatureRootSchemaModule: class MockFeatureRootSchemaModule {},
}));

jest.mock('@ynaa/shared-backend-feature-authentication', () => ({
  YnaaFeatureBackendAuthModule: {
    forRoot: jest.fn().mockReturnValue({
      module: class MockFeatureBackendAuthModule {},
      imports: [],
      providers: [],
      controllers: [],
      exports: [],
    }),
  },
}));

describe('AppModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(AppModule).toBeDefined();
  });

  it('should compile successfully', () => {
    expect(module).toBeDefined();
  });

  it('should provide AppController', () => {
    const controller = module.get<AppController>(AppController);
    expect(controller).toBeDefined();
    expect(controller).toBeInstanceOf(AppController);
  });

  it('should provide AppService', () => {
    const service = module.get<AppService>(AppService);
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(AppService);
  });

  it('should have correct module metadata', () => {
    // Test that the module has the expected structure
    const moduleMetadata = Reflect.getMetadata('imports', AppModule);
    const controllerMetadata = Reflect.getMetadata('controllers', AppModule);
    const providerMetadata = Reflect.getMetadata('providers', AppModule);

    expect(moduleMetadata).toBeDefined();
    expect(controllerMetadata).toBeDefined();
    expect(providerMetadata).toBeDefined();
  });

  it('should configure auth module with forRoot', () => {
    // Get the mocked module from the jest mock
    const {
      YnaaFeatureBackendAuthModule,
    } = require('@ynaa/shared-backend-feature-authentication');

    // Verify that forRoot was called
    expect(YnaaFeatureBackendAuthModule.forRoot).toHaveBeenCalledWith({
      jwtSecret: process.env.JWT_SECRET || 'your-secret-key-here',
      jwtExpiresIn: '1h',
    });
  });
});
