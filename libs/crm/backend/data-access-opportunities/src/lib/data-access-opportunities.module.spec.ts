import { Global, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { DB_TAG } from '@open-kingdom/shared-poly-util-constants';
import { DataAccessOpportunitiesModule } from './data-access-opportunities.module';
import { LeadsService } from './leads.service';
import { OpportunitiesService } from './opportunities.service';

@Global()
@Module({
  providers: [{ provide: DB_TAG, useValue: {} }],
  exports: [DB_TAG],
})
class FakeDbModule {}

describe('DataAccessOpportunitiesModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [FakeDbModule, DataAccessOpportunitiesModule],
    }).compile();
  });

  it('exposes LeadsService and OpportunitiesService to importers', () => {
    expect(module.get(LeadsService)).toBeDefined();
    expect(module.get(OpportunitiesService)).toBeDefined();
  });
});
