import { Module } from '@nestjs/common';
import { FeatureYoutubeModule } from '@open-kingdom/shared-backend-feature-youtube';
import { YouTubeTwinController } from './youtube-twin.controller.js';
import { YouTubeTwinService } from './youtube-twin.service.js';

@Module({
  imports: [FeatureYoutubeModule],
  controllers: [YouTubeTwinController],
  providers: [YouTubeTwinService],
  exports: [YouTubeTwinService],
})
export class YouTubeTwinModule {}
