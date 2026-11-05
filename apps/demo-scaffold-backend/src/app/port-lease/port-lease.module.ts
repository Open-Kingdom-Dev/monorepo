import { Module } from '@nestjs/common';
import { PortLeaseController } from './port-lease.controller';
import { PortLeaseService } from './port-lease.service';

@Module({
  controllers: [PortLeaseController],
  providers: [PortLeaseService],
})
export class PortLeaseModule {}
