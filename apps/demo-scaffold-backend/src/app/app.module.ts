import { Module } from '@nestjs/common';

import { OpenKingdomFeatureRootSchemaModule } from '@open-kingdom/demo-scaffold-backend-feature-root-schema';

@Module({
  imports: [
    OpenKingdomFeatureRootSchemaModule,
    import('@open-kingdom/shared-backend-feature-authentication').then((m) =>
      m.OpenKingdomFeatureBackendAuthModule.forRoot({
        jwtSecret: process.env.JWT_SECRET || 'your-secret-key-here',
        jwtExpiresIn: '1h',
      })
    ),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
