import { Test, TestingModule } from '@nestjs/testing';
import {
  createConfigService,
  nodeEnvAdapter,
} from '@open-kingdom/shared-poly-util-env-config';

import { AppModule } from './app.module';

const envKeys = ['JWT_SECRET', 'JWT_EXPIRES_IN'] as const;
const configService = createConfigService(envKeys, nodeEnvAdapter);

jest.mock('@open-kingdom/demo-scaffold-backend-feature-root-schema', () => ({
  OpenKingdomFeatureRootSchemaModule: class MockFeatureRootSchemaModule {},
}));

jest.mock('@open-kingdom/shared-backend-feature-authentication', () => ({
  OpenKingdomFeatureBackendAuthModule: {
    forRoot: jest.fn().mockReturnValue({
      module: class MockFeatureBackendAuthModule {},
      imports: [],
      providers: [],
      controllers: [],
      exports: [],
    }),
  },
}));

jest.mock('@open-kingdom/shared-backend-feature-email', () => {
  class MockEmailService {
    send = jest.fn().mockResolvedValue({ success: true });
  }
  return {
    EmailModule: {
      forRoot: jest.fn().mockReturnValue({
        module: class MockEmailModule {},
        imports: [],
        providers: [{ provide: MockEmailService, useClass: MockEmailService }],
        controllers: [],
        exports: [MockEmailService],
      }),
    },
    EmailService: MockEmailService,
  };
});

jest.mock('@open-kingdom/shared-backend-feature-user-management', () => {
  class MockUserRolesService {}
  return {
    FeatureUserManagementModule: {
      forRoot: jest.fn().mockReturnValue({
        module: class MockFeatureUserManagementModule {},
        imports: [],
        providers: [
          { provide: MockUserRolesService, useClass: MockUserRolesService },
        ],
        controllers: [],
        exports: [MockUserRolesService],
      }),
    },
    UserRolesService: MockUserRolesService,
  };
});

describe('AppModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('EMAIL_SENDER')
      .useValue({ send: jest.fn().mockResolvedValue({ success: true }) })
      .compile();
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
      OpenKingdomFeatureBackendAuthModule,
    } = require('@open-kingdom/shared-backend-feature-authentication');

    // Verify that forRoot was called
    expect(OpenKingdomFeatureBackendAuthModule.forRoot).toHaveBeenCalledWith({
      jwtSecret: configService.get('JWT_SECRET', 'your-secret-key-here'),
      jwtExpiresIn: configService.get('JWT_EXPIRES_IN', '1h'),
    });
  });
});
