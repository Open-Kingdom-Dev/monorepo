# Google Auth Emulate Module

This NestJS module demonstrates local Google OAuth 2.0 and OIDC emulation powered by [`vercel-labs/emulate`](https://github.com/vercel-labs/emulate).

## Purpose

It allows developers and CI automated pipelines to run the full Google OAuth sign-in flow (consent screen, authorization code issuance, token exchange, user profile fetching) locally without hitting production Google endpoints or needing real credentials.

## Module Structure

- **`google-auth-emulate.service.ts`**: Manages the emulator server lifecycle (`start()`, `stop()`, `reset()`, `status()`) and shares the frontend redirect URL helper.
- **`google-auth-emulate.strategy.ts`**: NestJS Passport strategy (`PassportStrategy(Strategy, 'google-emulate')`) extending `passport-google-oauth20`. Overrides `authorizationURL`, `tokenURL`, and `userProfileURL` to point to the local emulator endpoints, sends a single-use `state` + OIDC `nonce`, overrides `userProfile()` to send Bearer token authentication headers required by the emulator, and validates the ID token `nonce` on the callback.
- **`google-auth-emulate.state-store.ts`**: In-memory, single-use `state` store (see below).
- **`google-auth-emulate.guard.ts`** / **`google-auth-emulate.failure.filter.ts`**: Convert a rejected callback into a redirect back to the demo page.
- **`google-auth-emulate.controller.ts`**: Endpoints protected by the Passport guard for `/login` and `/callback`.
- **`google-auth-emulate.dto.ts`**: OpenAPI Swagger DTO schemas. Uses optional property properties (`?:`) for parser compatibility.

## Configuration & Environment Variables

| Environment Variable   | Description                           | Default / Emulator Value                                 |
| ---------------------- | ------------------------------------- | -------------------------------------------------------- |
| `GOOGLE_EMULATOR_PORT` | Port for the emulate server           | `9015`                                                   |
| `GOOGLE_EMULATOR_URL`  | Base URL of the emulate server        | `http://localhost:9015`                                  |
| `GOOGLE_CLIENT_ID`     | OAuth Client ID                       | `example-client-id.apps.googleusercontent.com`           |
| `GOOGLE_CLIENT_SECRET` | OAuth Client Secret                   | `GOCSPX-example_secret`                                  |
| `GOOGLE_CALLBACK_URL`  | OAuth Callback URL                    | `http://localhost:3000/api/google-auth-emulate/callback` |
| `BASE_URL`             | Frontend base URL to redirect back to | `http://localhost:4200`                                  |

## CSRF (`state`) and replay (`nonce`) protection

`passport-oauth2` does **not** send a `state` parameter unless a state store is configured —
its default `NullStore` sends nothing and correlates nothing on the callback. `state: true`
is not usable here either: it selects the session-backed store, which requires
`req.session`, and this app has no session middleware.

Instead the strategy passes a small in-memory store (`InMemoryOAuthStateStore`) as the
`store` option. Per authorization request it:

1. generates an opaque single-use `state` handle (the `?state=` parameter), and
2. keeps the request's OIDC `nonce` (the `?nonce=` parameter) alongside it.

On the callback the store rejects a missing or unknown `state` before Passport continues
(`Missing` / `Invalid or expired OAuth state parameter`), and `validate()` consumes the entry
(making it single-use) and compares the `nonce` claim in the ID token against the one sent.
A mismatch fails the flow. The ID token payload is decoded **without** signature verification —
this is a local demo, not a production token validator.

A rejected callback is turned into a redirect to
`${BASE_URL}/google-auth-demo?auth=error&message=...` so the demo page shows the reason instead
of a raw error response.

> **Demo scope:** the store lives in process memory only. A backend restart or a second backend
> instance invalidates pending sign-ins. This is intentional for a local twin — it is not a
> production session store.

## Production Swap Pattern

To switch from the local emulator to real Google OAuth in production, set the standard Google endpoint env vars or omit the endpoint overrides:

- `GOOGLE_AUTH_URL` = `https://accounts.google.com/o/oauth2/v2/auth`
- `GOOGLE_TOKEN_URL` = `https://oauth2.googleapis.com/token`
- `GOOGLE_USERINFO_URL` = `https://www.googleapis.com/oauth2/v3/userinfo`
