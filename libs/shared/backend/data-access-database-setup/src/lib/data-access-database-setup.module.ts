import { Module, DynamicModule } from '@nestjs/common';
import { DrizzleBetterSQLiteModule } from '@knaadh/nestjs-drizzle-better-sqlite3';

import { DB_TAG } from '@open-kingdom/shared-poly-util-constants';

export interface DatabaseSetupModuleOptions<
  TSchema extends Record<string, unknown> = Record<string, unknown>
> {
  filename?: string;
  schema: TSchema;
}

@Module({})
export class DatabaseSetupModule {
  static register<TSchema extends Record<string, unknown>>(
    options: DatabaseSetupModuleOptions<TSchema>
  ): DynamicModule {
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
