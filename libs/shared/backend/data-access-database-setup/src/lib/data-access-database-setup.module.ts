import { Module, DynamicModule } from '@nestjs/common';
import { DrizzleBetterSQLiteModule } from '@knaadh/nestjs-drizzle-better-sqlite3';

import { DB_TAG } from '@open-kingdom/shared-poly-util-constants';

import { schema } from './schemas/index.js';

export interface DatabaseSetupModuleOptions {
  filename?: string;
}

@Module({})
export class DatabaseSetupModule {
  static register(options: DatabaseSetupModuleOptions = {}): DynamicModule {
    return {
      module: DatabaseSetupModule,
      imports: [
        DrizzleBetterSQLiteModule.register({
          tag: DB_TAG,
          sqlite3: {
            filename: options.filename || 'demo.db',
          },
          config: { schema },
        }),
      ],
    };
  }
}
