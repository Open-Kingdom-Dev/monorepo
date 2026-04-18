import { Module } from '@nestjs/common';

import { ConfigurableLookupsService } from './configurable-lookups.service';
import { ConfigurableLookupsController } from './configurable-lookups.controller';

@Module({
  controllers: [ConfigurableLookupsController],
  providers: [ConfigurableLookupsService],
  exports: [ConfigurableLookupsService],
})
export class DataAccessConfigurableLookupsModule {}
