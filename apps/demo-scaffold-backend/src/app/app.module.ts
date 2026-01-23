import { Module } from '@nestjs/common';
import {
  createConfigService,
  nodeEnvAdapter,
} from '@open-kingdom/shared-poly-util-env-config';

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
] as const;

// Create typed config service for this app
const configService = createConfigService(envKeys, nodeEnvAdapter);

@Module({
  imports: [
    OpenKingdomFeatureRootSchemaModule,
    import('@open-kingdom/shared-backend-feature-authentication').then((m) =>
      m.OpenKingdomFeatureBackendAuthModule.forRoot({
        jwtSecret: configService.get('JWT_SECRET', 'your-secret-key-here'),
        jwtExpiresIn: configService.get('JWT_EXPIRES_IN', '1h'),
      })
    ),
    import('@open-kingdom/shared-backend-feature-email').then((m) =>
      m.EmailModule.forRoot({
        provider: 'gmail',
        config: {
          clientEmail: configService.get('GMAIL_CLIENT_EMAIL', ''),
          privateKey: configService.get('GMAIL_PRIVATE_KEY', ''),
          impersonateEmail: configService.get('GMAIL_IMPERSONATE_EMAIL', ''),
        },
      })
    ),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
