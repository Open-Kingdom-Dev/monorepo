import { Module, DynamicModule } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { StringValue } from 'ms';
import { OpenKingdomDataAccessBackendUsersModule } from '@open-kingdom/shared-backend-data-access-users';

import { AuthenticationService } from './authentication.service';
import { LocalStrategy } from './passport-local-strategy';
import { AuthController } from './auth.controller';
import { JwtStrategy, JWT_CONSTANTS } from './passport-jwt-strategy';

export interface AuthModuleOptions {
  jwtSecret: string;
  jwtExpiresIn?: number | StringValue;
}

@Module({})
export class OpenKingdomFeatureBackendAuthModule {
  static forRoot(options: AuthModuleOptions): DynamicModule {
    return {
      module: OpenKingdomFeatureBackendAuthModule,
      imports: [
        OpenKingdomDataAccessBackendUsersModule,
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
