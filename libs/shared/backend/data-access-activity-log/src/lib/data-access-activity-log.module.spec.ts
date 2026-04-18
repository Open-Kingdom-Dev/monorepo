import { Global, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { DB_TAG } from '@open-kingdom/shared-poly-util-constants';
import { DataAccessActivityLogModule } from './data-access-activity-log.module';
import { ActivityLogService } from './activity-log.service';

@Global()
@Module({
  providers: [{ provide: DB_TAG, useValue: {} }],
  exports: [DB_TAG],
})
class FakeDbModule {}

describe('DataAccessActivityLogModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [FakeDbModule, DataAccessActivityLogModule],
    }).compile();
  });

  it('exposes ActivityLogService to importers', () => {
    expect(module.get(ActivityLogService)).toBeDefined();
  });
});
