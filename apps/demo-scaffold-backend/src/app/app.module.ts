import { Module } from '@nestjs/common';

import { YnaaFeatureRootSchemaModule } from '@ynaa/demo-scaffold-backend-feature-root-schema';

import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    YnaaFeatureRootSchemaModule,
    import('@ynaa/shared-feature-backend-auth').then((m) =>
      m.YnaaFeatureBackendAuthModule.forRoot({
        jwtSecret: process.env.JWT_SECRET || 'your-secret-key-here',
        jwtExpiresIn: '1h',
      })
    ),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
