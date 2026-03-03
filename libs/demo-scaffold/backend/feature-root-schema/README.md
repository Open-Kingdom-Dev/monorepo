# @open-kingdom/demo-scaffold-backend-feature-root-schema

Composes all Drizzle ORM table schemas used by the demo-scaffold application and registers them with `DatabaseSetupModule` as a single NestJS module.

## Purpose

This library is the schema composition point for the demo-scaffold backend. Every Drizzle table used by the application must be collected here so the database module receives the complete schema for migration and query inference. Import this module in the root `AppModule` instead of registering `DatabaseSetupModule` directly.

## Exports

- `OpenKingdomFeatureRootSchemaModule` — NestJS `@Module` that imports `DatabaseSetupModule.register({ schema })` with the composed schema

## Composed Schema

The module wires the following tables into `DatabaseSetupModule`:

```typescript
const schema = {
  users, // from @open-kingdom/shared-backend-data-access-users
  invitations, // from @open-kingdom/shared-backend-feature-user-management
  userRoles, // from @open-kingdom/shared-backend-feature-user-management
};
```

## Usage

Import in the application root module:

```typescript
import { Module } from '@nestjs/common';
import { OpenKingdomFeatureRootSchemaModule } from '@open-kingdom/demo-scaffold-backend-feature-root-schema';

@Module({
  imports: [
    OpenKingdomFeatureRootSchemaModule,
    // other modules...
  ],
})
export class AppModule {}
```

## Extending for New Applications

When building a new application based on this scaffold, create a new equivalent module in your app's library:

```typescript
import { Module } from '@nestjs/common';
import { DatabaseSetupModule } from '@open-kingdom/shared-backend-data-access-database-setup';
import { DB_TAG } from '@open-kingdom/shared-poly-util-constants';
import { users } from '@open-kingdom/shared-backend-data-access-users';
import { invitations, userRoles } from '@open-kingdom/shared-backend-feature-user-management';
// Import additional table schemas from your feature libraries:
import { myTable } from '@your-scope/my-backend-feature';

const schema = { users, invitations, userRoles, myTable };

@Module({
  imports: [
    DatabaseSetupModule.register({
      schema,
      tag: DB_TAG, // from @open-kingdom/shared-poly-util-constants
      filename: 'myapp.db', // SQLite file name
    }),
  ],
  exports: [],
})
export class RootSchemaModule {}
```

## Architecture Note

This library has no build step — it is consumed directly from source (`src/index.ts`) within the monorepo. It is not published to npm (`"private": true` in `package.json`).

## Testing

```bash
nx test demo-scaffold-backend-feature-root-schema
```
