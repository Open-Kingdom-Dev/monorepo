import { Module, Global } from '@nestjs/common';
import { YoutubeSearchController } from './youtube-search.controller.js';
import { YoutubeSearchService } from './youtube-search.service.js';

@Global()
@Module({
  controllers: [YoutubeSearchController],
  providers: [YoutubeSearchService],
  exports: [YoutubeSearchService],
})
export class FeatureYoutubeModule {}
