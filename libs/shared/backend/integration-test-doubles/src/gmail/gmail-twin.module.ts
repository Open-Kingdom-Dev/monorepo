import { Module } from '@nestjs/common';
import { GmailTwinController } from './gmail-twin.controller.js';
import { GmailTwinService } from './gmail-twin.service.js';
import { BearerJwtGuard } from './bearer-jwt.guard.js';

@Module({
  controllers: [GmailTwinController],
  providers: [GmailTwinService, BearerJwtGuard],
  exports: [GmailTwinService, BearerJwtGuard],
})
export class GmailTwinModule {}
