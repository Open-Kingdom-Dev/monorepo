/* eslint-disable @nx/enforce-module-boundaries -- static imports for app module */
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import {
  createConfigService,
  nodeEnvAdapter,
} from '@open-kingdom/shared-poly-util-env-config';

import { OpenKingdomFeatureRootSchemaModule } from '@open-kingdom/demo-scaffold-backend-feature-root-schema';
import {
  OpenKingdomFeatureBackendAuthModule,
  JwtAuthGuard,
} from '@open-kingdom/shared-backend-feature-authentication';
import { EmailModule } from '@open-kingdom/shared-backend-feature-email';
import {
  FeatureUserManagementModule,
  UserRolesService,
} from '@open-kingdom/shared-backend-feature-user-management';
import { FeatureGcpResourcesModule } from '@open-kingdom/shared-backend-feature-gcp-resources';
import { FeatureCrmModule } from '@open-kingdom/shared-backend-feature-crm';
import { TwinModule } from './twin/twin.module';
import {
  PermissionGuard,
  ROLE_RESOLVER,
} from '@open-kingdom/shared-backend-util-rbac';

// Define the environment keys that this app uses
const envKeys = [
  'PORT',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'BASE_URL',
  'INVITATION_TOKEN_SECRET',
  'GMAIL_CLIENT_EMAIL',
  'GMAIL_PRIVATE_KEY',
  'GMAIL_IMPERSONATE_EMAIL',
] as const;

// Create typed config service for this app
const configService = createConfigService(envKeys, nodeEnvAdapter);

@Module({
  imports: [
    OpenKingdomFeatureRootSchemaModule,
    OpenKingdomFeatureBackendAuthModule.forRoot({
      jwtSecret: configService.get('JWT_SECRET', 'your-secret-key-here'),
      jwtExpiresIn: configService.get('JWT_EXPIRES_IN', '1h'),
    }),
    EmailModule.forRoot({
      provider: 'gmail',
      config: {
        clientEmail: configService.get('GMAIL_CLIENT_EMAIL', ''),
        privateKey: configService.get('GMAIL_PRIVATE_KEY', ''),
        impersonateEmail: configService.get('GMAIL_IMPERSONATE_EMAIL', ''),
      },
    }),
    FeatureUserManagementModule.forRoot({
      invitationTokenSecret: configService.get(
        'INVITATION_TOKEN_SECRET',
        'default-invitation-secret'
      ),
      frontendBaseUrl: configService.get('BASE_URL', 'http://localhost:3000'),
    }),
    FeatureGcpResourcesModule,
    FeatureCrmModule.forRoot({ seedDefaults: true }),
    TwinModule,
  ],
  controllers: [],
  providers: [
    { provide: ROLE_RESOLVER, useExisting: UserRolesService },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionGuard },
  ],
})
export class AppModule {}
