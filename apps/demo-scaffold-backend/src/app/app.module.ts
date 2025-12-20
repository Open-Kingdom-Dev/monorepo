import { Module } from '@nestjs/common';
import {
  createConfigService,
  nodeEnvAdapter,
} from '@open-kingdom/shared-poly-util-env-config';
import { EmailModule } from '@open-kingdom/shared-backend-feature-email';
import { StringValue } from 'ms';

import { OpenKingdomFeatureRootSchemaModule } from '@open-kingdom/demo-scaffold-backend-feature-root-schema';

// Define the environment keys that this app uses
const envKeys = [
  'PORT',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'BASE_URL',
  'GMAIL_CLIENT_EMAIL',
  'GMAIL_PRIVATE_KEY',
  'GMAIL_IMPERSONATE_EMAIL',
  'INVITATION_TOKEN_SECRET',
  'FRONTEND_BASE_URL',
] as const;

// Create typed config service for this app
const configService = createConfigService(envKeys, nodeEnvAdapter);

@Module({
  imports: [
    OpenKingdomFeatureRootSchemaModule,
    // Static import - EmailService is available to all modules
    EmailModule.forRoot({
      provider: 'gmail',
      config: {
        clientEmail: configService.get('GMAIL_CLIENT_EMAIL', ''),
        privateKey: configService.get('GMAIL_PRIVATE_KEY', ''),
        impersonateEmail: configService.get('GMAIL_IMPERSONATE_EMAIL', ''),
      },
    }),
    import('@open-kingdom/shared-backend-feature-authentication').then((m) =>
      m.OpenKingdomFeatureBackendAuthModule.forRoot({
        jwtSecret: configService.get('JWT_SECRET', 'your-secret-key-here'),
        jwtExpiresIn: configService.get('JWT_EXPIRES_IN', '1h') as StringValue,
      })
    ),
    import('@open-kingdom/shared-backend-feature-user-management').then((m) =>
      m.UserManagementModule.forRoot({
        invitationTokenSecret: configService.get(
          'INVITATION_TOKEN_SECRET',
          'your-token-secret-here'
        ),
        invitationExpiryDays: 7,
        frontendBaseUrl: configService.get(
          'FRONTEND_BASE_URL',
          'http://localhost:4200'
        ),
      })
    ),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
