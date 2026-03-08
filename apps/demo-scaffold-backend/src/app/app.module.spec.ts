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
