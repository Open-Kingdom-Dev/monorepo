# `@open-kingdom/shared-backend-feature-authentication`

A NestJS dynamic module providing JWT + Passport-based authentication: a `POST /auth/login` endpoint, a `GET /profile` endpoint, a global-ready `JwtAuthGuard`, and a `@Public()` route decorator for bypassing the guard.

---

## Exports

| Export | Kind | Description |
|---|---|---|
| `OpenKingdomFeatureBackendAuthModule` | `class` | Dynamic NestJS module. Call `.forRoot(options)` to configure. |
| `JwtAuthGuard` | `class` | Passport JWT guard implementing `canActivate`. Skips routes decorated with `@Public()`. Register as `APP_GUARD` for global JWT enforcement. |
| `Public` | `function` | Decorator factory: `@Public()`. Marks a route handler or controller as publicly accessible (bypasses `JwtAuthGuard`). |
| `IS_PUBLIC_KEY` | `string` | Metadata key used by `@Public()`. Value: `'isPublic'`. |

---

## Type Definitions

### `AuthModuleOptions`

| Property | Type | Required | Default | Description |
|---|---|---|---|---|
| `jwtSecret` | `string` | Yes | — | HMAC secret used to sign and verify JWT tokens. |
| `jwtExpiresIn` | `string \| number` | No | `60` | Token lifetime. A number is interpreted as seconds. A string uses the ms format (e.g. `'60s'`, `'1h'`, `'7d'`). |

### `RequestWithUser`

After JWT validation, `req.user` is populated with the authenticated user's details. The shape excludes the password field and contains `id` (`number`), `firstName` (`string | null`), `lastName` (`string | null`), and `email` (`string`). The request also carries a `logout` method.

### DTOs

`LoginDto` accepts `email` and `password`, both typed as `string | undefined`. `LoginResponseDto` contains a single `access_token` string (the signed JWT). `ProfileResponseDto` contains `id` (`number`), `firstName` (`string | null`), `lastName` (`string | null`), and `email` (`string`).

### JWT Payload Structure

The token payload signed on login contains `username` (set to the user's email address) and `id` (the user's numeric primary key).

---

## Module Registration

`OpenKingdomFeatureBackendAuthModule` is a dynamic module. Call `.forRoot(options)` and include the result in the `imports` array.

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import {
  OpenKingdomFeatureBackendAuthModule,
  JwtAuthGuard,
} from '@open-kingdom/shared-backend-feature-authentication';

@Module({
  imports: [
    OpenKingdomFeatureBackendAuthModule.forRoot({
      jwtSecret: process.env['JWT_SECRET']!,
      jwtExpiresIn: '7d',
    }),
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
```

---

## Configuration Options

| Option | Type | Default | Description |
|---|---|---|---|
| `jwtSecret` | `string` | — (required) | HMAC secret for signing JWT tokens. Must be the same value in all instances sharing a session. |
| `jwtExpiresIn` | `string \| number` | `60` | Token expiry. A `number` is interpreted as seconds. A `string` uses the [ms](https://github.com/vercel/ms) format (`'60s'`, `'1h'`, `'7d'`). |

---

## What `forRoot()` Registers

The returned `DynamicModule` imports and provides the following:

| Component | Type | Description |
|---|---|---|
| `OpenKingdomDataAccessBackendUsersModule` | imported module | Provides `UsersService` for credential and token validation. |
| `PassportModule` | imported module | Registers Passport strategies. |
| `JwtModule` | imported module | Configured with `jwtSecret` and `jwtExpiresIn`. |
| `LocalStrategy` | provider | Passport `local` strategy. Validates `email`/`password` via `AuthenticationService.validateUser()`. Uses `usernameField: 'email'`. |
| `JwtStrategy` | provider | Passport `jwt` strategy. Extracts Bearer token from `Authorization` header, verifies signature, loads user via `UsersService.findOne()`. |
| `AuthenticationService` | provider | Calls `bcrypt.compare()` for login, calls `JwtService.sign()` to issue tokens. |
| `AuthController` | controller | Registers `POST /auth/login` and `GET /profile` endpoints. |
| `JWT_CONSTANTS` | provider | Value provider holding `{ secret: jwtSecret }`. Injected into `JwtStrategy` using the token `'JWT_CONSTANTS'`. |

Exported from the module: `AuthenticationService`, `JwtStrategy`.

---

## API Endpoints

### `POST /auth/login`

Authenticates a user with email and password using the Passport `local` strategy. This endpoint is decorated with `@Public()` and does not require a Bearer token.

The request body must contain an `email` string and a `password` string. On success (`200 OK`), the response contains an `access_token` string (the signed JWT). On failure, the response is `401 Unauthorized` with a message of `"Invalid credentials"`.

### `GET /profile`

Returns the authenticated user's profile. Requires a valid Bearer token in the `Authorization` header. On success (`200 OK`), the response contains the user's `id`, `firstName`, `lastName`, and `email`. Returns `401 Unauthorized` if the token is missing, expired, or invalid.

---

## JwtAuthGuard

`JwtAuthGuard` extends `AuthGuard('jwt')` and overrides `canActivate`. When registered as `APP_GUARD`, it protects all routes by default.

**Bypass logic:** If the route handler or its controller class is decorated with `@Public()`, the guard returns `true` without invoking the JWT strategy.

```typescript
import { Controller, Get } from '@nestjs/common';
import { Public } from '@open-kingdom/shared-backend-feature-authentication';

@Controller('health')
export class HealthController {
  @Public()
  @Get()
  check() {
    return { status: 'ok' };
  }
}
```

**Global registration (required for guard to apply everywhere):**

```typescript
providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }]
```

---

## Public Decorator

```typescript
import { Public } from '@open-kingdom/shared-backend-feature-authentication';

// Applied to a route handler:
@Public()
@Get('open')
openEndpoint() { ... }

// Applied to an entire controller (all routes become public):
@Public()
@Controller('open')
export class OpenController { ... }
```

`IS_PUBLIC_KEY` is the metadata key (`'isPublic'`) that `@Public()` sets. `JwtAuthGuard` reads this key via NestJS's `Reflector` to determine whether to skip authentication.

---

## AuthenticationService API

| Method | Parameters | Returns | Description |
|---|---|---|---|
| `validateUser` | `email: string, password: string` | `Promise<Omit<User, 'password'>>` | Validates email and password. Throws `UnauthorizedException` on failure. Returns the user object without the password field. |
| `login` | `user: Omit<User, 'password'>` | `Promise<{ access_token: string }>` | Signs a JWT with payload `{ username: user.email, id: user.id }` and returns it wrapped in an object. |

---

## Testing

```bash
nx test @open-kingdom/shared-backend-feature-authentication
```
