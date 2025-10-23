import { Module } from '@nestjs/common';

import { OpenKingdomFeatureRootSchemaModule } from '@open-kingdom/demo-scaffold-backend-feature-root-schema';

import { AppController } from './app.controller';
import { AppService } from './app.service';

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
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
