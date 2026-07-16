import { Global, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { DB_TAG, SCHEMA_TAG } from '@open-kingdom/shared-poly-util-constants';
import { leads, opportunities } from './schemas';
import { DataAccessOpportunitiesModule } from './data-access-opportunities.module';
import { LeadsService } from './leads.service';
import { OpportunitiesService } from './opportunities.service';

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
  providers: [{ provide: SCHEMA_TAG, useValue: { leads, opportunities } }],
  exports: [SCHEMA_TAG],
})
class TestSchemaModule {}

describe('DataAccessOpportunitiesModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [FakeDbModule, TestSchemaModule, DataAccessOpportunitiesModule],
    }).compile();
  });

  it('exposes LeadsService and OpportunitiesService to importers', () => {
    expect(module.get(LeadsService)).toBeDefined();
    expect(module.get(OpportunitiesService)).toBeDefined();
  });
});
