import {
  YnaaFeatureBackendAuthModule,
  AuthModuleOptions,
} from './feature-backend-auth.module';
import { JWT_CONSTANTS } from './passport-jwt-strategy';
import { AuthenticationService } from './authentication.service';
import { LocalStrategy } from './passport-local-strategy';
import { JwtStrategy } from './passport-jwt-strategy';
import { AuthController } from './auth.controller';

describe('YnaaFeatureBackendAuthModule', () => {
  const mockOptions: AuthModuleOptions = {
    jwtSecret: 'test-secret',
    jwtExpiresIn: '1h',
  };

  it('should be defined', () => {
    expect(YnaaFeatureBackendAuthModule).toBeDefined();
  });

  it('should create a dynamic module with forRoot', () => {
    const dynamicModule = YnaaFeatureBackendAuthModule.forRoot(mockOptions);

    expect(dynamicModule).toBeDefined();
    expect(dynamicModule.module).toBe(YnaaFeatureBackendAuthModule);
    expect(dynamicModule.imports).toBeDefined();
    expect(dynamicModule.providers).toBeDefined();
    expect(dynamicModule.controllers).toBeDefined();
    expect(dynamicModule.exports).toBeDefined();
  });

  it('should include JWT constants provider', () => {
    const dynamicModule = YnaaFeatureBackendAuthModule.forRoot(mockOptions);

    const jwtConstantsProvider = dynamicModule.providers?.find(
      (provider) =>
        typeof provider === 'object' &&
        'provide' in provider &&
        provider.provide === JWT_CONSTANTS
    );

    expect(jwtConstantsProvider).toBeDefined();
    expect(jwtConstantsProvider).toEqual({
      provide: JWT_CONSTANTS,
      useValue: { secret: mockOptions.jwtSecret },
    });
  });

  it('should include all required providers', () => {
    const dynamicModule = YnaaFeatureBackendAuthModule.forRoot(mockOptions);

    expect(dynamicModule.providers).toContain(AuthenticationService);
    expect(dynamicModule.providers).toContain(LocalStrategy);
    expect(dynamicModule.providers).toContain(JwtStrategy);
  });

  it('should include all required imports', () => {
    const dynamicModule = YnaaFeatureBackendAuthModule.forRoot(mockOptions);

    expect(dynamicModule.imports).toBeDefined();
    expect(dynamicModule.imports?.length).toBeGreaterThan(0);
  });

  it('should include all required controllers', () => {
    const dynamicModule = YnaaFeatureBackendAuthModule.forRoot(mockOptions);

    expect(dynamicModule.controllers).toContain(AuthController);
  });

  it('should include all required exports', () => {
    const dynamicModule = YnaaFeatureBackendAuthModule.forRoot(mockOptions);

    expect(dynamicModule.exports).toContain(AuthenticationService);
    expect(dynamicModule.exports).toContain(JwtStrategy);
  });

  it('should use default jwtExpiresIn when not provided', () => {
    const optionsWithoutExpiresIn: AuthModuleOptions = {
      jwtSecret: 'test-secret',
    };

    const dynamicModule = YnaaFeatureBackendAuthModule.forRoot(
      optionsWithoutExpiresIn
    );
    expect(dynamicModule).toBeDefined();
  });
});
