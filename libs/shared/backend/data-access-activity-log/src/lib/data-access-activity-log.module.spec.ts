import { Global, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { DB_TAG, SCHEMA_TAG } from '@open-kingdom/shared-poly-util-constants';
import { activityLog } from './schemas';
import { DataAccessActivityLogModule } from './data-access-activity-log.module';
import { ActivityLogService } from './activity-log.service';

@Global()
@Module({
  providers: [{ provide: DB_TAG, useValue: {} }],
  exports: [DB_TAG],
})
class FakeDbModule {}

// Stand-in for DatabaseSetupModule's global SCHEMA_TAG provider — services
// resolve their tables through it (host-composable, prefixable schemas).
@Global()
@Module({
  providers: [{ provide: SCHEMA_TAG, useValue: { activityLog } }],
  exports: [SCHEMA_TAG],
})
class TestSchemaModule {}

describe('DataAccessActivityLogModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [FakeDbModule, TestSchemaModule, DataAccessActivityLogModule],
    }).compile();
  });

  it('exposes ActivityLogService to importers', () => {
    expect(module.get(ActivityLogService)).toBeDefined();
  });
});
