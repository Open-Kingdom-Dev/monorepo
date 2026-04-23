import { Module } from '@nestjs/common';
import { GcpProjectsController } from './gcp-projects.controller.js';
import { GcpProjectsService } from './gcp-projects.service.js';
import {
  GcsStorageService,
  GCS_STORAGE_CLIENT,
  createGcsStorageClient,
} from './gcs-storage.service.js';
import { GcsStorageController } from './gcs-storage.controller.js';

@Module({
  controllers: [GcpProjectsController, GcsStorageController],
  providers: [
    GcpProjectsService,
    {
      provide: GCS_STORAGE_CLIENT,
      useFactory: createGcsStorageClient,
    },
    GcsStorageService,
  ],
  exports: [GcpProjectsService, GcsStorageService],
})
export class FeatureGcpResourcesModule {}
