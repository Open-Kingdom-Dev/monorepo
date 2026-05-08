import { DynamicModule, Module } from '@nestjs/common';

import { ActivityLogService } from './activity-log.service';
import { ActivityLogController } from './activity-log.controller';
import {
  ACTIVITY_LOG_OPTIONS,
  DataAccessActivityLogOptions,
} from './data-access-activity-log.options';

@Module({
  controllers: [ActivityLogController],
  providers: [ActivityLogService],
  exports: [ActivityLogService],
})
export class DataAccessActivityLogModule {
  static forRoot(options: DataAccessActivityLogOptions = {}): DynamicModule {
    return {
      module: DataAccessActivityLogModule,
      controllers: [ActivityLogController],
      providers: [
        { provide: ACTIVITY_LOG_OPTIONS, useValue: options },
        ActivityLogService,
      ],
      exports: [ActivityLogService],
    };
  }
}
