import { Module, Global } from '@nestjs/common';
import { YoutubeErrorModeManager } from '@open-kingdom/shared-backend-integration-test-doubles';
import { YoutubeSearchController } from './youtube-search.controller.js';
import { YoutubeSearchService } from './youtube-search.service.js';

@Global()
@Module({
  controllers: [YoutubeSearchController],
  providers: [
    YoutubeSearchService,
    YoutubeErrorModeManager,
  ],
  exports: [
    YoutubeSearchService,
    YoutubeErrorModeManager,
  ],
})
export class FeatureYoutubeModule {}
