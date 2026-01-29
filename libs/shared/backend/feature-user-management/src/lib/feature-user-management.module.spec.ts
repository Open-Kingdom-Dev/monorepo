import { Test, TestingModule } from '@nestjs/testing';
import { FeatureUserManagementModule } from './feature-user-management.module';

describe('FeatureUserManagementModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [FeatureUserManagementModule],
    }).compile();
  });

  afterEach(async () => {
    await module.close();
  });

  describe('module setup', () => {
    it('can be imported into a NestJS application', () => {
      expect(module).toBeDefined();
    });
  });

  // Note: This module currently serves as a schema-only package.
  // The invitations schema is exported via the package index.
  // Services (e.g., InvitationsService) will be added in future iterations.
});
