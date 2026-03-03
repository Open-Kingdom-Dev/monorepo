# `@open-kingdom/shared-backend-data-access-users`

A NestJS module providing `UsersService` for User entity persistence via Drizzle ORM + SQLite, including bcrypt password hashing, full CRUD operations, and automatic admin user seeding on startup.

---

## Exports

| Export | Kind | Description |
|---|---|---|
| `OpenKingdomDataAccessBackendUsersModule` | `class` | Standard NestJS module. Provides and exports `UsersService`. |
| `DataAccessBackendUsersModule` | `class` | Alias for `OpenKingdomDataAccessBackendUsersModule`. |
| `UsersService` | `class` | Injectable service for all user persistence operations. |
| `users` | `BetterSQLite3Table` | Drizzle table definition for the `users` table. |
| `UsersTableName` | `string` | The literal string `'users'`. Used when constructing typed schema objects. |
| `User` | `type` | TypeScript type inferred from `users.$inferSelect`. |
| `NewUser` | `type` | TypeScript type inferred from `users.$inferInsert`. |

---

## Type Definitions

### `users` Table Schema

The `users` SQLite table has the following columns:

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `integer` | Primary key, auto-increment | Unique user identifier |
| `first_name` | `text` | Nullable | User's first name |
| `last_name` | `text` | Nullable | User's last name |
| `email` | `text` | Not null, unique | User's email address |
| `password` | `text` | Not null | bcrypt-hashed password; never returned in plaintext |

### `User` Type

The `User` type is inferred from `users.$inferSelect` and has the following shape:

| Property | Type | Description |
|---|---|---|
| `id` | `number` | Auto-incremented primary key |
| `firstName` | `string \| null` | User's first name |
| `lastName` | `string \| null` | User's last name |
| `email` | `string` | Unique email address |
| `password` | `string` | bcrypt hash — never exposed to clients |

### `NewUser` Type

The `NewUser` type is inferred from `users.$inferInsert`. All fields are the same as `User` except `id` is optional (omitted for auto-increment inserts) and `firstName`/`lastName` are also optional. When passed to `UsersService.create()`, the `password` field is plaintext — the service hashes it before storage.

---

## Module Registration

`OpenKingdomDataAccessBackendUsersModule` is a standard (non-dynamic) module. It does not call `register()` or `forRoot()`. Import it directly.

This module does **not** register the database connection itself. `DatabaseSetupModule.register()` must be registered globally (in the root `AppModule`) before this module is imported.

```typescript
// some-feature.module.ts
import { Module } from '@nestjs/common';
import { OpenKingdomDataAccessBackendUsersModule } from '@open-kingdom/shared-backend-data-access-users';

@Module({
  imports: [OpenKingdomDataAccessBackendUsersModule],
  // UsersService is now available for injection in this module's providers
})
export class SomeFeatureModule {}
```

When imported inside a dynamic module (e.g., `FeatureUserManagementModule`), the import is declared in the returned `DynamicModule` object's `imports` array — the same pattern applies.

---

## Configuration

No configuration options. The service resolves its database dependency via the global `DB_TAG` token provided by `DatabaseSetupModule`.

---

## UsersService API

### Constructor Injection

```typescript
import { UsersService } from '@open-kingdom/shared-backend-data-access-users';

@Injectable()
export class MyService {
  constructor(private usersService: UsersService) {}
}
```

### Methods

| Method | Parameters | Returns | Description |
|---|---|---|---|
| `findOne` | `email: string` | `Promise<User \| undefined>` | Finds a user by email address. Returns `undefined` if not found. |
| `findById` | `id: number` | `Promise<User \| undefined>` | Finds a user by primary key. Returns `undefined` if not found. |
| `findAll` | — | `Promise<User[]>` | Returns all users. |
| `create` | `data: Omit<User, 'id'>` | `Promise<User>` | Inserts a new user. Hashes the plaintext password with bcrypt (12 salt rounds) before storage. |
| `delete` | `id: number` | `Promise<void>` | Deletes a user by primary key. |
| `ensureUser` | `data: Omit<User, 'id'>` | `Promise<User \| undefined>` | Inserts a user only if no user with that email already exists. Returns the existing user if found. Password is hashed before storage (same as `create`). |

### Lifecycle: `onModuleInit`

`UsersService` implements `OnModuleInit`. On application startup it calls `ensureUser` with a default admin account (`email: 'admin@admin.com'`, `password: 'admin'`, first and last name both `'Admin'`). This seeds a default admin user if the database is empty. **Change or remove this default credential in production.**

---

## Drizzle Schema Reference

The `users` table definition is exported from this package and must be included in the `schema` passed to `DatabaseSetupModule.register()` so that relational queries work correctly. The `UsersTableName` constant (`'users'`) can be used as a key when building typed schema composition objects.

```typescript
import { users, UsersTableName } from '@open-kingdom/shared-backend-data-access-users';

DatabaseSetupModule.register({
  schema: { [UsersTableName]: users, ...otherTables },
  filename: 'app.db',
});
```

The `invitations` table in `feature-user-management` references `users.id` via a foreign key, so the `users` table must be present in the schema whenever that module is used.

---

## Injecting UsersService in a Custom Module

```typescript
import { Module } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import {
  OpenKingdomDataAccessBackendUsersModule,
  UsersService,
  User,
} from '@open-kingdom/shared-backend-data-access-users';

@Injectable()
export class ProfileService {
  constructor(private usersService: UsersService) {}

  async getProfile(id: number): Promise<Omit<User, 'password'> | undefined> {
    const user = await this.usersService.findById(id);
    if (!user) return undefined;
    const { password: _, ...rest } = user;
    return rest;
  }
}

@Module({
  imports: [OpenKingdomDataAccessBackendUsersModule],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}
```

---

## Testing

```bash
nx test @open-kingdom/shared-backend-data-access-users
```
