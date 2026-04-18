import { Global, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { DB_TAG } from '@open-kingdom/shared-poly-util-constants';
import { DataAccessContactsModule } from './data-access-contacts.module';
import { CompaniesService } from './companies.service';
import { ContactsService } from './contacts.service';

@Global()
@Module({
  providers: [{ provide: DB_TAG, useValue: {} }],
  exports: [DB_TAG],
})
class FakeDbModule {}

describe('DataAccessContactsModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [FakeDbModule, DataAccessContactsModule],
    }).compile();
  });

  it('exposes CompaniesService and ContactsService to importers', () => {
    expect(module.get(CompaniesService)).toBeDefined();
    expect(module.get(ContactsService)).toBeDefined();
  });
});
