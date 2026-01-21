import { Module, DynamicModule } from '@nestjs/common';
import { DrizzleBetterSQLiteModule } from '@knaadh/nestjs-drizzle-better-sqlite3';

import { DB_TAG } from '@open-kingdom/shared-poly-util-constants';

export interface DatabaseSetupModuleOptions {
  filename?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: Record<string, any>;
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
