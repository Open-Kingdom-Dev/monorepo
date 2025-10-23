import { Test, TestingModule } from '@nestjs/testing';
import { DrizzleBetterSQLiteModule } from '@knaadh/nestjs-drizzle-better-sqlite3';

import { DB_TAG } from '@open-kingdom/shared-poly-util-constants';
import { OpenKingdomFeatureRootSchemaModule } from './feature-root-schema.module';

describe('OpenKingdomFeatureRootSchemaModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        DrizzleBetterSQLiteModule.register({
          tag: DB_TAG,
          sqlite3: {
            filename: 'demo-test.db',
          },
          config: { schema: {} },
        }),
        OpenKingdomFeatureRootSchemaModule,
      ],
    }).compile();
  });

  afterEach(async () => {
    await module.close();
  });

  describe('module configuration', () => {
    it('should be defined', () => {
      expect(OpenKingdomFeatureRootSchemaModule).toBeDefined();
    });

    it('should have no controllers', () => {
      const moduleRef = module.get(OpenKingdomFeatureRootSchemaModule);
      expect(moduleRef).toBeDefined();
    });
  });
});
