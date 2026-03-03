# `@open-kingdom/shared-backend-data-access-database-setup`

A NestJS global dynamic module that opens a `better-sqlite3` connection, wraps it with Drizzle ORM, applies SQLite PRAGMAs, and provides the `BetterSQLite3Database` instance to the NestJS DI container under the `DB_TAG` injection token.

---

## Exports

| Export                       | Kind        | Description                                                          |
| ---------------------------- | ----------- | -------------------------------------------------------------------- |
| `DatabaseSetupModule`        | `class`     | Global NestJS dynamic module. Use `.register(options)` to configure. |
| `DatabaseSetupModuleOptions` | `interface` | Type-only export. Type of the argument accepted by `.register()`.    |

---

## Type Definitions

`DatabaseSetupModuleOptions` is a generic interface with a type parameter `TSchema extends Record<string, unknown>` (defaulting to `Record<string, unknown>`). It accepts the following properties:

| Property   | Type                     | Required | Default     | Description                                                                                                                            |
| ---------- | ------------------------ | -------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `schema`   | `TSchema`                | Yes      | —           | Drizzle table definitions object. Pass all tables the application needs so relational queries resolve correctly.                       |
| `filename` | `string`                 | No       | `'demo.db'` | Path to the SQLite database file. Relative paths resolve from the process working directory. The file is created if it does not exist. |
| `pragmas`  | `Record<string, string>` | No       | `{}`        | SQLite PRAGMAs applied immediately after the connection opens. Each key/value pair is executed as `sqlite.pragma('key = value')`.      |

The injection token is **not** exported from this package. It is `DB_TAG` from `@open-kingdom/shared-poly-util-constants`.

---

## Module Registration

`DatabaseSetupModule` is declared `global: true`. Register it **once** in the root `AppModule`. All other modules throughout the application can inject the database without importing this module again.

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { DatabaseSetupModule } from '@open-kingdom/shared-backend-data-access-database-setup';
import * as schema from '@open-kingdom/demo-scaffold-backend-feature-root-schema';

@Module({
  imports: [
    DatabaseSetupModule.register({
      schema,
      filename: process.env['DB_FILENAME'] ?? 'app.db',
      pragmas: {
        journal_mode: 'WAL',
        foreign_keys: 'ON',
      },
    }),
  ],
})
export class AppModule {}
```

---

## Configuration Options

| Option     | Type                                      | Default      | Description                                                                                                                                                                            |
| ---------- | ----------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `schema`   | `TSchema extends Record<string, unknown>` | — (required) | All Drizzle table definition objects the application needs. Pass the full merged schema so that relational queries (`db.query.*`) resolve correctly.                                   |
| `filename` | `string`                                  | `'demo.db'`  | Path to the SQLite database file. Relative paths resolve from the process working directory. The file is created if it does not exist.                                                 |
| `pragmas`  | `Record<string, string>`                  | `{}`         | SQLite PRAGMAs applied immediately after the connection opens. Each entry is executed as `sqlite.pragma('key = value')`. Common values: `{ journal_mode: 'WAL', foreign_keys: 'ON' }`. |

---

## Module Behavior

1. `DatabaseSetupModule.register(options)` returns a `DynamicModule` with `global: true`.
2. The module factory opens (or creates) the SQLite file at `options.filename` using `better-sqlite3`.
3. Each entry in `options.pragmas` is applied synchronously before any queries run.
4. Drizzle ORM wraps the connection using the provided `options.schema`.
5. The resulting `BetterSQLite3Database<TSchema>` is provided under the `DB_TAG` token and exported globally.

Migration execution is **not** performed automatically. Migrations are managed via `drizzle-kit` scripts in the application's `package.json`. The typical scripts are `db:generate` (runs `drizzle-kit generate`) and `db:migrate` (runs `drizzle-kit migrate`), both pointing to a `drizzle.config.ts` configuration file.

---

## Injecting the Database

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { DB_TAG } from '@open-kingdom/shared-poly-util-constants';
import * as schema from '@open-kingdom/demo-scaffold-backend-feature-root-schema';

@Injectable()
export class MyService {
  constructor(@Inject(DB_TAG) private db: BetterSQLite3Database<typeof schema>) {}

  async findAll() {
    return this.db.query.myTable.findMany();
  }
}
```

---

## API Reference

### `DatabaseSetupModule.register<TSchema>(options: DatabaseSetupModuleOptions<TSchema>): DynamicModule`

Static factory method returning a NestJS `DynamicModule`. Must be called in the `imports` array of a module decorator.

**Provided token:** `DB_TAG` → `BetterSQLite3Database<TSchema>`

**Global:** `true` — the provided token is visible to all modules in the application without further imports.

**Throws at startup** if the SQLite file cannot be opened (permission denied, invalid directory, etc.).

---

## Testing

```bash
nx test @open-kingdom/shared-backend-data-access-database-setup
```
