import { Module, DynamicModule } from '@nestjs/common';
import { DrizzleBetterSQLiteModule } from '@knaadh/nestjs-drizzle-better-sqlite3';

import { DB_TAG } from '@ynaa/shared-util-constants';

export type SchemaConfig = Record<string, unknown>;
export interface DatabaseSetupModuleOptions {
  schema: SchemaConfig;
  filename?: string;
}

@Module({})
export class DatabaseSetupModule {
  static register(options: DatabaseSetupModuleOptions): DynamicModule {
    return {
      module: DatabaseSetupModule,
      imports: [
        DrizzleBetterSQLiteModule.register({
          tag: DB_TAG,
          sqlite3: {
            filename: options.filename || 'demo.db',
          },
          config: { schema: options.schema },
        }),
      ],
    };
  }
}
