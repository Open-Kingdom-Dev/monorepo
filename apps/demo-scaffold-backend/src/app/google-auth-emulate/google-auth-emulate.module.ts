import { Module } from '@nestjs/common';
import { GoogleAuthEmulateService } from './google-auth-emulate.service';
import { GoogleAuthEmulateController } from './google-auth-emulate.controller';

@Module({
  controllers: [GoogleAuthEmulateController],
  providers: [GoogleAuthEmulateService],
  exports: [GoogleAuthEmulateService],
})
export class GoogleAuthEmulateModule {}
