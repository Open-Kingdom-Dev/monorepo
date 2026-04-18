import { Module } from '@nestjs/common';

import { LeadsService } from './leads.service';
import { OpportunitiesService } from './opportunities.service';
import { LeadsController } from './leads.controller';
import { OpportunitiesController } from './opportunities.controller';

@Module({
  controllers: [LeadsController, OpportunitiesController],
  providers: [LeadsService, OpportunitiesService],
  exports: [LeadsService, OpportunitiesService],
})
export class DataAccessOpportunitiesModule {}
