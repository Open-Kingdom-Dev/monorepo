import { Module } from '@nestjs/common';

import { CompaniesService } from './companies.service';
import { ContactsService } from './contacts.service';
import { CompaniesController } from './companies.controller';
import { ContactsController } from './contacts.controller';

@Module({
  controllers: [CompaniesController, ContactsController],
  providers: [CompaniesService, ContactsService],
  exports: [CompaniesService, ContactsService],
})
export class DataAccessContactsModule {}
