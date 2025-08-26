import { Module, DynamicModule } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { YnaaDataAccessBackendUsersModule } from '@ynaa/shared-data-access-backend-users';

import { AuthenticationService } from './authentication.service';
import { LocalStrategy } from './passport-local-strategy';
import { AuthController } from './auth.controller';
import { JwtStrategy, JWT_CONSTANTS } from './passport-jwt-strategy';

export interface AuthModuleOptions {
  jwtSecret: string;
  jwtExpiresIn?: string;
}

@Module({})
export class YnaaFeatureBackendAuthModule {
  static forRoot(options: AuthModuleOptions): DynamicModule {
    return {
      module: YnaaFeatureBackendAuthModule,
      imports: [
        YnaaDataAccessBackendUsersModule,
        PassportModule,
        JwtModule.register({
          secret: options.jwtSecret,
          signOptions: { expiresIn: options.jwtExpiresIn || '60s' },
        }),
      ],
      controllers: [AuthController],
      providers: [
        AuthenticationService,
        LocalStrategy,
        JwtStrategy,
        {
          provide: JWT_CONSTANTS,
          useValue: { secret: options.jwtSecret },
        },
      ],
      exports: [AuthenticationService, JwtStrategy],
    };
  }
}
