import { Module } from '@nestjs/common';
import { AppleMusicTwinService } from './apple-music-twin.service.js';
import { AppleMusicTwinController } from './apple-music-twin.controller.js';

@Module({
  controllers: [AppleMusicTwinController],
  providers: [AppleMusicTwinService],
  exports: [AppleMusicTwinService],
})
export class AppleMusicTwinModule {}
