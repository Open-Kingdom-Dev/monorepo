import { Module } from '@nestjs/common';

import { DatabaseSetupModule } from '@open-kingdom/shared-backend-data-access-database-setup';
import { users } from '@open-kingdom/shared-backend-data-access-users';
import {
  roles,
  permissions,
  rolePermissions,
  invitations,
  userRoles,
} from '@open-kingdom/shared-backend-feature-user-management';
import { configurableLookups } from '@open-kingdom/shared-backend-data-access-configurable-lookups';
import { activityLog } from '@open-kingdom/shared-backend-data-access-activity-log';
import {
  companies,
  contacts,
} from '@open-kingdom/crm-backend-data-access-contacts';
import {
  leads,
  opportunities,
} from '@open-kingdom/crm-backend-data-access-opportunities';

// Compose schema from all packages used by this app. These are the default
// (unprefixed) singletons; embedded hosts compose the same shape from the
// create*Schema factories with a table-name prefix instead — see
// "Composing a prefixed schema" in data-access-database-setup's README.
const schema = {
  users,
  roles,
  permissions,
  rolePermissions,
  invitations,
  userRoles,
  configurableLookups,
  activityLog,
  companies,
  contacts,
  leads,
  opportunities,
};

@Module({
  imports: [DatabaseSetupModule.register({ schema })],
  controllers: [],
  providers: [],
  exports: [],
})
export class OpenKingdomFeatureRootSchemaModule {}
