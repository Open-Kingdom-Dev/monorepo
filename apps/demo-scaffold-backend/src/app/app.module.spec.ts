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

jest.mock('@open-kingdom/shared-backend-feature-authentication', () => {
  class MockJwtAuthGuard {
    canActivate() {
      return true;
    }
  }
  return {
    OpenKingdomFeatureBackendAuthModule: {
      forRoot: jest.fn().mockReturnValue({
        module: class MockFeatureBackendAuthModule {},
        imports: [],
        providers: [],
        controllers: [],
        exports: [],
      }),
    },
    JwtAuthGuard: MockJwtAuthGuard,
  };
});

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
  class MockUserRolesService {
    findPrimaryRole = jest.fn().mockResolvedValue(null);
    findPermissions = jest.fn().mockResolvedValue([]);
  }
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

jest.mock('@open-kingdom/shared-backend-feature-gcp-resources', () => {
  const { Module, Injectable } = require('@nestjs/common');
  @Injectable()
  class MockGcsStorageService {
    setErrorMode = jest
      .fn()
      .mockReturnValue({ active: true, type: null, description: null });
    clearErrorMode = jest
      .fn()
      .mockReturnValue({ active: false, type: null, description: null });
    getErrorModeState = jest
      .fn()
      .mockReturnValue({ active: false, type: null, description: null });
    resetErrorMode = jest.fn();
    resetBuckets = jest.fn().mockResolvedValue(undefined);
    uploadFile = jest.fn();
    listFiles = jest.fn().mockResolvedValue([]);
    downloadFile = jest.fn();
    generateDownloadUrl = jest.fn();
    deleteFile = jest.fn();
  }
  @Module({
    providers: [MockGcsStorageService],
    exports: [MockGcsStorageService],
  })
  class MockFeatureGcpResourcesModule {}
  return {
    FeatureGcpResourcesModule: MockFeatureGcpResourcesModule,
    GcsStorageService: MockGcsStorageService,
  };
});

jest.mock('@open-kingdom/shared-backend-integration-test-doubles', () => {
  const { Injectable } = require('@nestjs/common');
  @Injectable()
  class MockGcsErrorSimulationInterceptor {
    intercept(_context: any, next: any) {
      return next.handle();
    }
  }
  @Injectable()
  class MockGcsErrorModeManager {
    getMode = jest.fn().mockReturnValue(null);
    setMode = jest.fn();
    clearMode = jest.fn();
    reset = jest.fn();
    matchRequest = jest.fn().mockReturnValue(null);
  }
  return {
    GcsErrorSimulationInterceptor: MockGcsErrorSimulationInterceptor,
    GcsErrorModeManager: MockGcsErrorModeManager,
  };
});

jest.mock('@open-kingdom/crm-backend-feature-crm', () => ({
  FeatureCrmModule: {
    forRoot: jest.fn().mockReturnValue({
      module: class MockFeatureCrmModule {},
      imports: [],
      providers: [],
      controllers: [],
      exports: [],
    }),
  },
}));

jest.mock('@open-kingdom/shared-backend-util-rbac', () => {
  class MockPermissionGuard {
    canActivate() {
      return true;
    }
    onModuleInit() {
      return;
    }
  }
  return {
    PermissionGuard: MockPermissionGuard,
    ROLE_RESOLVER: 'ROLE_RESOLVER',
    Public: () => () => undefined,
    IS_PUBLIC_KEY: 'isPublic',
    RequirePermission: () => () => undefined,
    REQUIRED_PERMISSION_KEY: 'requiredPermission',
  };
});

describe('assembling the application', () => {
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

  it('starts up without errors', () => {
    expect(module).toBeDefined();
  });

  it('wires up imports, controllers, and providers', () => {
    const imports = Reflect.getMetadata('imports', AppModule);
    const controllers = Reflect.getMetadata('controllers', AppModule);
    const providers = Reflect.getMetadata('providers', AppModule);

    expect(imports).toBeDefined();
    expect(controllers).toBeDefined();
    expect(providers).toBeDefined();
  });

  it('configures authentication with the environment settings', () => {
    const {
      OpenKingdomFeatureBackendAuthModule,
    } = require('@open-kingdom/shared-backend-feature-authentication');

    expect(OpenKingdomFeatureBackendAuthModule.forRoot).toHaveBeenCalledWith({
      jwtSecret: configService.get('JWT_SECRET', 'your-secret-key-here'),
      jwtExpiresIn: configService.get('JWT_EXPIRES_IN', '1h'),
    });
  });
});
