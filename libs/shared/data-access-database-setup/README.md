# data-access-database-setup

This library provides a configurable database setup module for NestJS applications using Drizzle ORM with SQLite.

## Features

- Dynamic module configuration for database setup
- Configurable schema injection
- SQLite database configuration with Drizzle ORM
- Example schema implementation

## Usage

### Basic Usage

```typescript
import { Module } from '@nestjs/common';
import { DatabaseSetupModule } from '@ynaa/shared-data-access-database-setup';
import { mySchema } from './my-schema';

@Module({
  imports: [
    DatabaseSetupModule.register({
      schema: mySchema,
      tag: 'MY_DB',
      filename: 'my-app.db',
    }),
  ],
})
export class AppModule {}
```

### Using the Example Schema

```typescript
import { Module } from '@nestjs/common';
import { DatabaseSetupModule, exampleSchema } from '@ynaa/shared-data-access-database-setup';

@Module({
  imports: [
    DatabaseSetupModule.register({
      schema: exampleSchema,
    }),
  ],
})
export class AppModule {}
```

### Configuration Options

The `DatabaseSetupModule.register()` method accepts the following options:

- `schema`: **Required** - The database schema object containing table definitions
- `tag`: **Optional** - Database connection tag (defaults to 'DB_DEV')
- `filename`: **Optional** - SQLite database filename (defaults to 'demo.db')

## Schema Definition

Your schema should be defined using Drizzle ORM's table builders:

```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
});

export const mySchema = {
  users,
};
```

## Running unit tests

Run `nx test data-access-database-setup` to execute the unit tests via [Jest](https://jestjs.io).
