import { Global, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { DB_TAG, SCHEMA_TAG } from '@open-kingdom/shared-poly-util-constants';
import { companies, contacts } from './schemas';
import { DataAccessContactsModule } from './data-access-contacts.module';
import { CompaniesService } from './companies.service';
import { ContactsService } from './contacts.service';

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
  providers: [{ provide: SCHEMA_TAG, useValue: { companies, contacts } }],
  exports: [SCHEMA_TAG],
})
class TestSchemaModule {}

describe('DataAccessContactsModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [FakeDbModule, TestSchemaModule, DataAccessContactsModule],
    }).compile();
  });

  it('exposes CompaniesService and ContactsService to importers', () => {
    expect(module.get(CompaniesService)).toBeDefined();
    expect(module.get(ContactsService)).toBeDefined();
  });
});
