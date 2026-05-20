import { Module } from '@nestjs/common';
import { FeatureGcpResourcesModule } from '@open-kingdom/shared-backend-feature-gcp-resources';
import { TwinController } from './twin.controller';
import { TwinService } from './twin.service';

@Module({
  imports: [FeatureGcpResourcesModule],
  controllers: [TwinController],
  providers: [TwinService],
  exports: [TwinService],
})
export class TwinModule {}
