# Google Auth Emulate Module

This NestJS module demonstrates local Google OAuth 2.0 and OIDC emulation powered by [`vercel-labs/emulate`](https://github.com/vercel-labs/emulate).

## Purpose

It allows developers and CI automated pipelines to run the full Google OAuth sign-in flow (consent screen, authorization code issuance, token exchange, user profile fetching) locally without hitting production Google endpoints or needing real credentials.

## Module Structure

- **`google-auth-emulate.service.ts`**: Manages the emulator server lifecycle (`start()`, `stop()`, `reset()`, `status()`).
- **`google-auth-emulate.strategy.ts`**: NestJS Passport strategy (`PassportStrategy(Strategy, 'google-emulate')`) extending `passport-google-oauth20`. Overrides `authorizationURL`, `tokenURL`, and `userProfileURL` to point to the local emulator endpoints. Overrides `userProfile()` to send Bearer token authentication headers required by the emulator.
- **`google-auth-emulate.controller.ts`**: Endpoints protected by NestJS Passport `@UseGuards(AuthGuard('google-emulate'))` for `/login` and `/callback`.
- **`google-auth-emulate.dto.ts`**: OpenAPI Swagger DTO schemas. Uses optional property properties (`?:`) for parser compatibility.

## Configuration & Environment Variables

| Environment Variable   | Description                    | Default / Emulator Value                                 |
| ---------------------- | ------------------------------ | -------------------------------------------------------- |
| `GOOGLE_EMULATOR_PORT` | Port for the emulate server    | `9015`                                                   |
| `GOOGLE_EMULATOR_URL`  | Base URL of the emulate server | `http://localhost:9015`                                  |
| `GOOGLE_CLIENT_ID`     | OAuth Client ID                | `example-client-id.apps.googleusercontent.com`           |
| `GOOGLE_CLIENT_SECRET` | OAuth Client Secret            | `GOCSPX-example_secret`                                  |
| `GOOGLE_CALLBACK_URL`  | OAuth Callback URL             | `http://localhost:3000/api/google-auth-emulate/callback` |

## Production Swap Pattern

To switch from the local emulator to real Google OAuth in production, set the standard Google endpoint env vars or omit the endpoint overrides:

- `GOOGLE_AUTH_URL` = `https://accounts.google.com/o/oauth2/v2/auth`
- `GOOGLE_TOKEN_URL` = `https://oauth2.googleapis.com/token`
- `GOOGLE_USERINFO_URL` = `https://www.googleapis.com/oauth2/v3/userinfo`
