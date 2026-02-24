/* eslint-disable @nx/enforce-module-boundaries -- static imports for app module */
import { Module } from '@nestjs/common';
import {
  createConfigService,
  nodeEnvAdapter,
} from '@open-kingdom/shared-poly-util-env-config';

import { OpenKingdomFeatureRootSchemaModule } from '@open-kingdom/demo-scaffold-backend-feature-root-schema';
import { OpenKingdomFeatureBackendAuthModule } from '@open-kingdom/shared-backend-feature-authentication';
import { EmailModule } from '@open-kingdom/shared-backend-feature-email';
import { FeatureUserManagementModule } from '@open-kingdom/shared-backend-feature-user-management';
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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
