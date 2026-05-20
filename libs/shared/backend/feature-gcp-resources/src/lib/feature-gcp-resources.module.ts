import { Module, Global } from '@nestjs/common';
import { GcsErrorModeManager } from '@open-kingdom/shared-backend-integration-test-doubles';
import { GcpProjectsController } from './gcp-projects.controller.js';
import { GcpProjectsService } from './gcp-projects.service.js';
import {
  GcsStorageService,
  GCS_STORAGE_CLIENT,
  createGcsStorageClient,
} from './gcs-storage.service.js';
import { GcsStorageController } from './gcs-storage.controller.js';
import { GcsErrorSimulationInterceptor } from '@open-kingdom/shared-backend-integration-test-doubles';

@Global()
@Module({
  controllers: [GcpProjectsController, GcsStorageController],
  providers: [
    GcpProjectsService,
    GcsErrorModeManager,
    GcsErrorSimulationInterceptor,
    {
      provide: GCS_STORAGE_CLIENT,
      useFactory: createGcsStorageClient,
    },
    GcsStorageService,
  ],
  exports: [
    GcpProjectsService,
    GcsStorageService,
    GcsErrorModeManager,
    GcsErrorSimulationInterceptor,
  ],
})
export class FeatureGcpResourcesModule {}
