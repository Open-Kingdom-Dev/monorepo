import { Module } from '@nestjs/common';

import { DatabaseSetupModule } from '@open-kingdom/shared-backend-data-access-database-setup';

@Module({
  imports: [DatabaseSetupModule.register()],
  controllers: [],
  providers: [],
  exports: [],
})
export class OpenKingdomFeatureRootSchemaModule {}
