import { Module } from '@nestjs/common';
import { GcpProjectsController } from './gcp-projects.controller.js';
import { GcpProjectsService } from './gcp-projects.service.js';

@Module({
  controllers: [GcpProjectsController],
  providers: [GcpProjectsService],
  exports: [GcpProjectsService],
})
export class FeatureGcpResourcesModule {}
