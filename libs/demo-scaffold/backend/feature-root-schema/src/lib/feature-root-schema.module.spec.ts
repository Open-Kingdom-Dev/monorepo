import { Test, TestingModule } from '@nestjs/testing';
import { DrizzleBetterSQLiteModule } from '@knaadh/nestjs-drizzle-better-sqlite3';

import { DB_TAG } from '@ynaa/shared-poly-util-constants';
import { YnaaFeatureRootSchemaModule } from './feature-root-schema.module';

describe('YnaaFeatureRootSchemaModule', () => {
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
        YnaaFeatureRootSchemaModule,
      ],
    }).compile();
  });

  afterEach(async () => {
    await module.close();
  });

  describe('module configuration', () => {
    it('should be defined', () => {
      expect(YnaaFeatureRootSchemaModule).toBeDefined();
    });

    it('should have no controllers', () => {
      const moduleRef = module.get(YnaaFeatureRootSchemaModule);
      expect(moduleRef).toBeDefined();
    });
  });
});
