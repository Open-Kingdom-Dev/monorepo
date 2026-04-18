import { Global, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { DB_TAG } from '@open-kingdom/shared-poly-util-constants';
import { DataAccessConfigurableLookupsModule } from './data-access-configurable-lookups.module';
import { ConfigurableLookupsService } from './configurable-lookups.service';

@Global()
@Module({
  providers: [{ provide: DB_TAG, useValue: {} }],
  exports: [DB_TAG],
})
class FakeDbModule {}

describe('DataAccessConfigurableLookupsModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [FakeDbModule, DataAccessConfigurableLookupsModule],
    }).compile();
  });

  it('exposes ConfigurableLookupsService to importers', () => {
    const service = module.get(ConfigurableLookupsService);
    expect(service).toBeDefined();
  });
});
