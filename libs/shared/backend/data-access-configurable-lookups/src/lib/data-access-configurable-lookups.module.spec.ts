import { Global, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { DB_TAG, SCHEMA_TAG } from '@open-kingdom/shared-poly-util-constants';
import { configurableLookups } from './schemas';
import { DataAccessConfigurableLookupsModule } from './data-access-configurable-lookups.module';
import { ConfigurableLookupsService } from './configurable-lookups.service';

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
  providers: [{ provide: SCHEMA_TAG, useValue: { configurableLookups } }],
  exports: [SCHEMA_TAG],
})
class TestSchemaModule {}

describe('DataAccessConfigurableLookupsModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        FakeDbModule,
        TestSchemaModule,
        DataAccessConfigurableLookupsModule,
      ],
    }).compile();
  });

  it('exposes ConfigurableLookupsService to importers', () => {
    const service = module.get(ConfigurableLookupsService);
    expect(service).toBeDefined();
  });
});
