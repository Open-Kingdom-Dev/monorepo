import { Module } from '@nestjs/common';

import { DatabaseSetupModule } from '@open-kingdom/shared-backend-data-access-database-setup';
import { users } from '@open-kingdom/shared-backend-data-access-users';
import { invitations } from '@open-kingdom/shared-backend-feature-user-management';

// Compose schema from all packages used by this app
const schema = { users, invitations };

@Module({
  imports: [DatabaseSetupModule.register({ schema })],
  controllers: [],
  providers: [],
  exports: [],
})
export class OpenKingdomFeatureRootSchemaModule {}
