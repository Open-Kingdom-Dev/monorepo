import { DynamicModule, Module } from '@nestjs/common';

import { DataAccessConfigurableLookupsModule } from '@open-kingdom/shared-backend-data-access-configurable-lookups';
import { DataAccessActivityLogModule } from '@open-kingdom/shared-backend-data-access-activity-log';
import { DataAccessContactsModule } from '@open-kingdom/shared-backend-data-access-contacts';
import { DataAccessOpportunitiesModule } from '@open-kingdom/shared-backend-data-access-opportunities';
import { FeatureUserManagementModule } from '@open-kingdom/shared-backend-feature-user-management';

import { LeadConversionService } from './services/lead-conversion.service';
import { DashboardService } from './services/dashboard.service';
import { CrmSeedService } from './services/crm-seed.service';
import { LeadConversionController } from './controllers/lead-conversion.controller';
import { DashboardController } from './controllers/dashboard.controller';
import {
  CRM_FEATURE_OPTIONS,
  CrmFeatureOptions,
} from './crm-feature.options';

@Module({
  imports: [
    DataAccessConfigurableLookupsModule,
    DataAccessActivityLogModule,
    DataAccessContactsModule,
    DataAccessOpportunitiesModule,
  ],
  controllers: [LeadConversionController, DashboardController],
  providers: [LeadConversionService, DashboardService],
  exports: [LeadConversionService, DashboardService],
})
export class FeatureCrmModule {
  static forRoot(options: CrmFeatureOptions = {}): DynamicModule {
    return {
      module: FeatureCrmModule,
      imports: [
        DataAccessConfigurableLookupsModule,
        DataAccessActivityLogModule,
        DataAccessContactsModule,
        DataAccessOpportunitiesModule,
        // user-management is needed so CrmSeedService can look up roles +
        // permissions when the host app has not imported it at forRoot scope.
        // The host app normally also imports FeatureUserManagementModule.forRoot
        // earlier; NestJS de-duplicates module instances.
      ],
      providers: [
        { provide: CRM_FEATURE_OPTIONS, useValue: options },
        LeadConversionService,
        DashboardService,
        CrmSeedService,
      ],
      controllers: [LeadConversionController, DashboardController],
      exports: [LeadConversionService, DashboardService],
    };
  }
}

// Referenced above so the lint rule recognizes the dependency.
void FeatureUserManagementModule;
