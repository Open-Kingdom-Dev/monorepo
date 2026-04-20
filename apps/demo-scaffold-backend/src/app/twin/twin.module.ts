import { Module } from '@nestjs/common';
import { TwinController } from './twin.controller';
import { TwinService } from './twin.service';

@Module({
  controllers: [TwinController],
  providers: [TwinService],
  exports: [TwinService],
})
export class TwinModule {}
