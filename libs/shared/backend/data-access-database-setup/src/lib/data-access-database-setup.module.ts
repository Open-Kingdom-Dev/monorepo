import { Module, DynamicModule } from '@nestjs/common';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

import { DB_TAG, SCHEMA_TAG } from '@open-kingdom/shared-poly-util-constants';

export interface DatabaseSetupModuleOptions<
  TSchema extends Record<string, unknown> = Record<string, unknown>
> {
  filename?: string;
  schema: TSchema;
  pragmas?: Record<string, string>;
}

@Module({})
export class DatabaseSetupModule {
  static register<TSchema extends Record<string, unknown>>(
    options: DatabaseSetupModuleOptions<TSchema>
  ): DynamicModule {
    return {
      module: DatabaseSetupModule,
      global: true,
      providers: [
        {
          provide: DB_TAG,
          useFactory: () => {
            const sqlite = new Database(options.filename || 'demo.db');

            for (const [key, value] of Object.entries(options.pragmas ?? {})) {
              sqlite.pragma(`${key} = ${value}`);
            }

            return drizzle(sqlite, {
              schema: options.schema,
              casing: 'snake_case',
            });
          },
        },
        // The composed schema itself, so services resolve table objects via DI
        // (supports host-composed, table-name-prefixed schemas — see the
        // create*Schema factories exported by each data-access lib).
        {
          provide: SCHEMA_TAG,
          useValue: options.schema,
        },
      ],
      exports: [DB_TAG, SCHEMA_TAG],
    };
  }
}
