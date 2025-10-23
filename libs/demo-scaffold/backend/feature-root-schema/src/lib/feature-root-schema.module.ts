import { Module } from '@nestjs/common';

import { DatabaseSetupModule } from '@open-kingdom/shared-backend-data-access-database-setup';
import {
  users,
  UserTableName,
} from '@open-kingdom/shared-backend-data-access-users';

const schema = {
  [UserTableName]: users,
};

@Module({
  imports: [DatabaseSetupModule.register({ schema })],
  controllers: [],
  providers: [],
  exports: [],
})
export class OpenKingdomFeatureRootSchemaModule {}
