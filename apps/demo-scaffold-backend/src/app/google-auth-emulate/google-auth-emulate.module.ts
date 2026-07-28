import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { GoogleAuthEmulateService } from './google-auth-emulate.service';
import { GoogleAuthEmulateController } from './google-auth-emulate.controller';
import { GoogleAuthEmulateStrategy } from './google-auth-emulate.strategy';

@Module({
  imports: [PassportModule],
  controllers: [GoogleAuthEmulateController],
  providers: [GoogleAuthEmulateService, GoogleAuthEmulateStrategy],
  exports: [GoogleAuthEmulateService],
})
export class GoogleAuthEmulateModule {}
