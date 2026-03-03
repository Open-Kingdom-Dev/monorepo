# `@open-kingdom/shared-backend-feature-user-management`

A NestJS dynamic module providing REST endpoints and services for user listing/deletion and the complete invitation lifecycle (create, list, cancel, validate, accept). Integrates with `data-access-users` for persistence and `feature-email` for invitation delivery.

---

## Exports

| Export                        | Kind                 | Description                                                                                                                                     |
| ----------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `FeatureUserManagementModule` | `class`              | Dynamic NestJS module. Call `.forRoot(options)` to configure.                                                                                   |
| `UserManagementService`       | `class`              | User listing and deletion with self-deletion guard.                                                                                             |
| `InvitationsService`          | `class`              | Full invitation lifecycle (invite, validate, accept, list, cancel).                                                                             |
| `UserManagementModuleOptions` | `interface`          | Type-only. Argument type for `.forRoot()`.                                                                                                      |
| `USER_MANAGEMENT_OPTIONS`     | `string`             | DI token for module options. Value: `'USER_MANAGEMENT_OPTIONS'`.                                                                                |
| `EMAIL_SENDER`                | `string`             | DI token aliasing `EmailService` as `EmailSender`. Value: `'EMAIL_SENDER'`.                                                                     |
| `INVITATION_STATUS`           | `const`              | Status constants object with keys `PENDING`, `ACCEPTED`, and `EXPIRED` mapping to the string values `'pending'`, `'accepted'`, and `'expired'`. |
| `Role`                        | `type`               | Union of `'guest'`, `'user'`, and `'admin'`.                                                                                                    |
| `InvitationStatus`            | `type`               | Union of `'pending'`, `'accepted'`, and `'expired'`.                                                                                            |
| `AuthenticatedRequest`        | `interface`          | Express `Request` extended with `user: { id: number; email: string }`.                                                                          |
| `EmailSender`                 | `interface`          | Contract for the email dependency. Satisfied by `EmailService` from `feature-email`.                                                            |
| `ValidationResult`            | `interface`          | Return type of `InvitationsService.validate()`.                                                                                                 |
| `invitations`                 | `BetterSQLite3Table` | Drizzle table definition for the `invitations` table.                                                                                           |
| `Invitation`                  | `type`               | Inferred from `invitations.$inferSelect`.                                                                                                       |
| `NewInvitation`               | `type`               | Inferred from `invitations.$inferInsert`.                                                                                                       |
| `InvitationsTableName`        | `string`             | Literal `'invitations'`.                                                                                                                        |
| `userRoles`                   | `BetterSQLite3Table` | Drizzle table definition for the `user_roles` table.                                                                                            |
| `UserRole`                    | `type`               | Inferred from `userRoles.$inferSelect`.                                                                                                         |
| `NewUserRole`                 | `type`               | Inferred from `userRoles.$inferInsert`.                                                                                                         |
| `UserRolesTableName`          | `string`             | Literal `'user_roles'`.                                                                                                                         |
| `InviteUserDto`               | `class`              | Request DTO for `POST /invitations/invite`.                                                                                                     |
| `AcceptInvitationDto`         | `class`              | Request DTO for `POST /invitations/accept`.                                                                                                     |
| `InvitationResponse`          | `type`               | `Omit<Invitation, 'token'>` — the token is never returned to clients.                                                                           |
| `UserWithoutPassword`         | `type`               | `Omit<User, 'password'>` — the password is never returned to clients.                                                                           |

---

## Type Definitions

### `UserManagementModuleOptions`

| Property                | Type     | Required | Default | Description                                                                                                                |
| ----------------------- | -------- | -------- | ------- | -------------------------------------------------------------------------------------------------------------------------- |
| `invitationTokenSecret` | `string` | Yes      | —       | HMAC-SHA256 secret for signing invitation tokens. Compromise allows forged tokens.                                         |
| `invitationExpiryDays`  | `number` | No       | `7`     | Number of days an invitation token remains valid after creation.                                                           |
| `frontendBaseUrl`       | `string` | Yes      | —       | Base URL of the frontend application. Invitation links use the format `{frontendBaseUrl}/accept-invitation?token={token}`. |

### `Role` and `InvitationStatus`

`Role` is a string union of `'guest'`, `'user'`, and `'admin'`. `InvitationStatus` is a string union of `'pending'`, `'accepted'`, and `'expired'`. The `INVITATION_STATUS` constant object provides these string values as named properties for use without string literals.

### `ValidationResult`

| Property | Type                  | Description                                                          |
| -------- | --------------------- | -------------------------------------------------------------------- |
| `valid`  | `boolean`             | Whether the token is valid and unexpired.                            |
| `email`  | `string \| undefined` | Present when `valid` is `true`. The invitee's email address.         |
| `role`   | `Role \| undefined`   | Present when `valid` is `true`. The role assigned to the invitation. |

### `EmailSender` Interface

The `EmailSender` interface is the contract this module uses for its email dependency. It requires a `send` method that accepts an object with `to` (string), `subject` (string), and `body` (string) and returns a `Promise` resolving to an object with `success` (boolean) and an optional `error` (string). This is satisfied by `EmailService` from `feature-email`.

### `invitations` Table Schema

| Column        | Type      | Constraints                   | Description                                                  |
| ------------- | --------- | ----------------------------- | ------------------------------------------------------------ |
| `id`          | `integer` | Primary key, auto-increment   | Unique invitation identifier                                 |
| `email`       | `text`    | Not null                      | Invitee email address                                        |
| `token`       | `text`    | Not null, unique              | HMAC-SHA256 hex token; never returned to clients via the API |
| `tokenExpiry` | `integer` | Not null                      | Unix timestamp (ms) of expiry                                |
| `invitedBy`   | `integer` | Not null, FK → `users.id`     | ID of the user who sent the invitation                       |
| `invitedAt`   | `integer` | Not null                      | Unix timestamp (ms) of creation                              |
| `role`        | `text`    | Not null, default `'guest'`   | Role to assign on acceptance                                 |
| `status`      | `text`    | Not null, default `'pending'` | Current invitation status                                    |

### `user_roles` Table Schema

| Column       | Type      | Constraints                 | Description                                |
| ------------ | --------- | --------------------------- | ------------------------------------------ |
| `id`         | `integer` | Primary key, auto-increment | Unique role assignment identifier          |
| `userId`     | `integer` | Not null, FK → `users.id`   | The user this role is assigned to          |
| `role`       | `text`    | Not null, default `'guest'` | The assigned role                          |
| `assignedAt` | `integer` | Not null                    | Unix timestamp (ms) of assignment          |
| `assignedBy` | `integer` | Nullable, FK → `users.id`   | The user who made the assignment; nullable |

### `InviteUserDto`

| Property | Type                           | Required | Description                                          |
| -------- | ------------------------------ | -------- | ---------------------------------------------------- |
| `email`  | `string`                       | Yes      | Email address of the invitee.                        |
| `role`   | `'guest' \| 'user' \| 'admin'` | No       | Role to assign on acceptance. Defaults to `'guest'`. |

### `AcceptInvitationDto`

| Property    | Type     | Required | Description                                                    |
| ----------- | -------- | -------- | -------------------------------------------------------------- |
| `token`     | `string` | Yes      | Token from the invitation link.                                |
| `password`  | `string` | Yes      | Plaintext password for the new account (minimum 8 characters). |
| `firstName` | `string` | No       | Optional first name for the new account.                       |
| `lastName`  | `string` | No       | Optional last name for the new account.                        |

---

## Module Registration

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { FeatureUserManagementModule } from '@open-kingdom/shared-backend-feature-user-management';

@Module({
  imports: [
    // DatabaseSetupModule.register(...) must be registered globally first.
    // EmailModule.forRoot(...) must be registered globally first.
    FeatureUserManagementModule.forRoot({
      invitationTokenSecret: process.env['INVITATION_SECRET']!,
      invitationExpiryDays: 7,
      frontendBaseUrl: process.env['FRONTEND_URL']!,
    }),
  ],
})
export class AppModule {}
```

---

## Configuration Options

| Option                  | Type     | Default      | Description                                                                                                                               |
| ----------------------- | -------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `invitationTokenSecret` | `string` | — (required) | HMAC-SHA256 secret for token generation. Keep secret; compromise allows forged invitation tokens.                                         |
| `invitationExpiryDays`  | `number` | `7`          | Number of days an invitation token remains valid after creation.                                                                          |
| `frontendBaseUrl`       | `string` | — (required) | Base URL of the frontend application. Invitation emails contain a link in the format `{frontendBaseUrl}/accept-invitation?token={token}`. |

---

## What `forRoot()` Registers

| Component                                 | Role                                                                       |
| ----------------------------------------- | -------------------------------------------------------------------------- |
| `OpenKingdomDataAccessBackendUsersModule` | imported; provides `UsersService`                                          |
| `USER_MANAGEMENT_OPTIONS`                 | value provider for `UserManagementModuleOptions`                           |
| `EMAIL_SENDER`                            | `useExisting: EmailService` — aliases the globally provided `EmailService` |
| `InvitationsService`                      | invitation lifecycle management                                            |
| `UserManagementService`                   | user listing and deletion                                                  |
| `InvitationsController`                   | registers invitation routes                                                |
| `UsersController`                         | registers user routes                                                      |

Exported from the module: `InvitationsService`, `UserManagementService`.

---

## REST Endpoints

All authenticated endpoints require a JWT Bearer token. The `UsersController` applies `AuthGuard('jwt')` at the controller level. The `InvitationsController` applies `AuthGuard('jwt')` per-route.

### Users

| Method   | Path         | Auth     | Description                                                                                                                   |
| -------- | ------------ | -------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `GET`    | `/users`     | Required | List all users (passwords excluded).                                                                                          |
| `GET`    | `/users/:id` | Required | Get a single user by ID.                                                                                                      |
| `DELETE` | `/users/:id` | Required | Delete a user. Throws `403 Forbidden` if `:id` matches the requester's own ID. Throws `404 Not Found` if user does not exist. |

### Invitations

| Method   | Path                           | Auth     | Description                                                                                                     |
| -------- | ------------------------------ | -------- | --------------------------------------------------------------------------------------------------------------- |
| `GET`    | `/invitations`                 | Required | List pending and expired invitations (accepted ones excluded). Stale invitations are auto-expired on retrieval. |
| `POST`   | `/invitations/invite`          | Required | Create and send an invitation. Returns `InvitationResponse` (token excluded).                                   |
| `GET`    | `/invitations/validate/:token` | None     | Validate a token. Returns `ValidationResult`.                                                                   |
| `POST`   | `/invitations/accept`          | None     | Accept an invitation and create a user account. Returns the new user (password excluded).                       |
| `DELETE` | `/invitations/:id`             | Required | Cancel and permanently delete an invitation record.                                                             |

### Request/Response Shapes

**`POST /invitations/invite`** accepts a body with `email` (string, required) and `role` (optional, defaults to `'guest'`). On success (`201`) it returns an `InvitationResponse` object containing `id`, `email`, `tokenExpiry` (Unix ms), `invitedBy` (user ID), `invitedAt` (Unix ms), `role`, and `status`. The `token` field is never included in the response.

Error responses for `POST /invitations/invite`:

- `400 Bad Request` — a user with that email already exists, or a non-expired pending invitation already exists for that email.
- `502 Bad Gateway` — email delivery failed; the invitation record is rolled back.

**`GET /invitations/validate/:token`** returns `{ valid: true, email: "...", role: "..." }` for a valid token, or `{ valid: false }` for an unknown, expired, or already-accepted token.

**`POST /invitations/accept`** accepts a body with `token` (string, required), `password` (string, required, min 8 chars), and optional `firstName` and `lastName`. On success (`201`) it returns the newly created user object with `id`, `firstName`, `lastName`, and `email` — the password is never included.

---

## UserManagementService API

| Method     | Parameters                        | Returns                          | Description                                                                                                             |
| ---------- | --------------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `findAll`  | —                                 | `Promise<UserWithoutPassword[]>` | Returns all users with password excluded.                                                                               |
| `findById` | `id: number`                      | `Promise<UserWithoutPassword>`   | Returns a user by ID. Throws `NotFoundException` if not found.                                                          |
| `delete`   | `id: number, requesterId: number` | `Promise<void>`                  | Deletes a user. Throws `ForbiddenException` if `id === requesterId`. Throws `NotFoundException` if user does not exist. |

---

## InvitationsService API

| Method     | Parameters                                                               | Returns                         | Description                                                                                                                                                                                                                                                      |
| ---------- | ------------------------------------------------------------------------ | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `invite`   | `email: string, role: Role, invitedById: number`                         | `Promise<InvitationResponse>`   | Creates an invitation, sends an email, and returns `InvitationResponse` (no token). Throws `BadRequestException` if a user or pending invitation already exists for the email. Throws `BadGatewayException` if email delivery fails (invitation is rolled back). |
| `validate` | `token: string`                                                          | `Promise<ValidationResult>`     | Validates a token. Returns `{ valid: false }` for unknown, expired, or already-accepted tokens.                                                                                                                                                                  |
| `accept`   | `token: string, password: string, firstName?: string, lastName?: string` | `Promise<User>`                 | Validates the token, creates a user via `UsersService.create()`, and marks the invitation as accepted. Throws `BadRequestException` for invalid or expired tokens.                                                                                               |
| `findAll`  | —                                                                        | `Promise<InvitationResponse[]>` | Lists all non-accepted invitations. Stale pending invitations are auto-expired before returning.                                                                                                                                                                 |
| `cancel`   | `id: number`                                                             | `Promise<void>`                 | Permanently deletes an invitation record. Throws `NotFoundException` if not found.                                                                                                                                                                               |

### Token Generation

Invitation tokens are HMAC-SHA256 hex strings. The signed payload combines the invitee's email, the expiry timestamp, and 16 random bytes. Tokens are stored in the database and delivered only via email — they are never returned by any API response.

---

## Drizzle Schema Inclusion

The `invitations` and `userRoles` table definitions must be included in the schema passed to `DatabaseSetupModule.register()`:

```typescript
import { invitations, userRoles } from '@open-kingdom/shared-backend-feature-user-management';
import { users } from '@open-kingdom/shared-backend-data-access-users';

DatabaseSetupModule.register({
  schema: { users, invitations, userRoles },
  filename: 'app.db',
});
```

---

## Full Application Registration Pattern

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { DatabaseSetupModule } from '@open-kingdom/shared-backend-data-access-database-setup';
import { OpenKingdomFeatureBackendAuthModule, JwtAuthGuard } from '@open-kingdom/shared-backend-feature-authentication';
import { EmailModule } from '@open-kingdom/shared-backend-feature-email';
import { FeatureUserManagementModule } from '@open-kingdom/shared-backend-feature-user-management';
import { users } from '@open-kingdom/shared-backend-data-access-users';
import { invitations, userRoles } from '@open-kingdom/shared-backend-feature-user-management';

@Module({
  imports: [
    DatabaseSetupModule.register({
      schema: { users, invitations, userRoles },
      filename: process.env['DB_FILENAME'] ?? 'app.db',
      pragmas: { journal_mode: 'WAL', foreign_keys: 'ON' },
    }),
    OpenKingdomFeatureBackendAuthModule.forRoot({
      jwtSecret: process.env['JWT_SECRET']!,
    }),
    EmailModule.forRoot({
      provider: 'gmail',
      config: {
        clientEmail: process.env['GMAIL_CLIENT_EMAIL']!,
        privateKey: process.env['GMAIL_PRIVATE_KEY']!,
        impersonateEmail: process.env['GMAIL_IMPERSONATE_EMAIL']!,
      },
    }),
    FeatureUserManagementModule.forRoot({
      invitationTokenSecret: process.env['INVITATION_SECRET']!,
      frontendBaseUrl: process.env['FRONTEND_URL']!,
      invitationExpiryDays: 7,
    }),
  ],
  providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}
```

---

## Testing

```bash
nx test @open-kingdom/shared-backend-feature-user-management
```
