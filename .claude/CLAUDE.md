# OpenKingdom Monorepo — AI Code Generation Context

This is the OpenKingdom Nx monorepo — a full-stack enterprise application toolkit designed to serve as the foundation for AI-generated applications. It provides reusable, composable libraries covering authentication, user management, database setup, email, theming, data grids, client-side logging, and notification systems.

## Architectural Overview

```
monorepo/
├── apps/
│   ├── demo-scaffold/          # React + Vite frontend application
│   └── demo-scaffold-backend/  # NestJS backend application
└── libs/
    ├── shared/
    │   ├── backend/            # NestJS modules (feature-*, data-access-*)
    │   ├── frontend/           # React components and Redux slices
    │   └── poly/               # Isomorphic utilities (Node + Browser)
    └── demo-scaffold/
        ├── backend/            # App-specific schema composition
        └── frontend/           # App-specific store composition
```

## Tech Stack

| Layer              | Technology                                            |
| ------------------ | ----------------------------------------------------- |
| Backend framework  | NestJS 11                                             |
| Database           | SQLite via Drizzle ORM + better-sqlite3               |
| Auth               | Passport.js + JWT (`@nestjs/passport`, `@nestjs/jwt`) |
| Frontend framework | React 19                                              |
| State management   | Redux Toolkit + RTK Query                             |
| Build system       | Nx 22 (monorepo orchestration)                        |
| Frontend build     | Vite                                                  |
| Styling            | Tailwind CSS                                          |
| Data grid          | AG Grid Community                                     |
| Testing (backend)  | Jest                                                  |
| Testing (frontend) | Vitest                                                |
| E2E testing        | Playwright                                            |
| API codegen        | OpenAPI → RTK Query (custom Nx plugin)                |

## Package Naming Convention

```
@open-kingdom/<scope>-<env>-<type>-<name>
```

- **scope**: `shared` (published, reusable) or `demo-scaffold` (app-specific)
- **env**: `backend`, `frontend`, or `poly` (isomorphic)
- **type**: `feature` (user-facing), `data-access` (persistence/state), `ui` (components), `util` (utilities)
- **name**: descriptive kebab-case name

## Core Library Map

### Backend (NestJS)

| Package                                                   | Import Token / Class                                                         | Purpose                               |
| --------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------- |
| `@open-kingdom/shared-backend-data-access-database-setup` | `DatabaseSetupModule`                                                        | Drizzle + SQLite DI setup             |
| `@open-kingdom/shared-backend-data-access-users`          | `UsersService`, `users` schema                                               | User persistence + bcrypt             |
| `@open-kingdom/shared-backend-feature-authentication`     | `OpenKingdomFeatureBackendAuthModule`, `JwtAuthGuard`, `@Public()`           | JWT auth + login endpoint             |
| `@open-kingdom/shared-backend-feature-email`              | `EmailModule`, `EmailService`                                                | Email via Gmail provider              |
| `@open-kingdom/shared-backend-feature-user-management`    | `FeatureUserManagementModule`, `UserManagementService`, `InvitationsService` | User + invitation CRUD                |
| `@open-kingdom/shared-backend-feature-gcp-resources`      | `FeatureGcpResourcesModule`                                                  | GCP project listing                   |
| `@open-kingdom/shared-backend-util-port-lease`            | `leaseSlot`, `portsForSlot`, `envForSlot`                                    | Per-worktree dev/test port allocation |

### Frontend (React + Redux)

| Package                                                   | Key Exports                                           | Purpose                          |
| --------------------------------------------------------- | ----------------------------------------------------- | -------------------------------- |
| `@open-kingdom/shared-frontend-data-access-api-client`    | `baseApi`, `apiReducer`, `apiMiddleware`, `authSlice` | RTK Query base + JWT auth state  |
| `@open-kingdom/shared-frontend-data-access-logger`        | `loggerSlice`, `logInfo/Warn/Error`, middleware       | Client log state + middleware    |
| `@open-kingdom/shared-frontend-data-access-notifications` | `notificationReducer`, `addNotification`              | Notification state               |
| `@open-kingdom/shared-frontend-data-access-external-api`  | `catFactsApiReducer`                                  | External API integration pattern |
| `@open-kingdom/shared-frontend-feature-notifications`     | `NotificationToastContainer`                          | Toast UI                         |
| `@open-kingdom/shared-frontend-feature-error-autologger`  | `createReduxRTKErrorMiddleware`                       | Auto error capture               |
| `@open-kingdom/shared-frontend-feature-user-management`   | User management UI components                         | Admin user/invite UI             |
| `@open-kingdom/shared-frontend-ui-datagrid`               | `DataGrid`                                            | AG Grid wrapper                  |
| `@open-kingdom/shared-frontend-ui-theme`                  | `ThemeProvider`, `useTheme`                           | Design tokens + dark mode        |

### Isomorphic (Poly)

| Package                                     | Key Exports                                                                         | Purpose                    |
| ------------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------- |
| `@open-kingdom/shared-poly-util-constants`  | `DB_TAG`                                                                            | Shared DI tokens           |
| `@open-kingdom/shared-poly-util-env-config` | `ConfigService`, `createConfigService`, `nodeEnvAdapter`, `createBrowserEnvAdapter` | Type-safe env vars         |
| `@open-kingdom/shared-poly-util-types`      | Various types                                                                       | Shared TypeScript types    |
| `@open-kingdom/shared-poly-util-date`       | Date utilities                                                                      | Date formatting/comparison |

## Standard Module Wiring Patterns

### Backend AppModule

```typescript
@Module({
  imports: [
    OpenKingdomFeatureRootSchemaModule,     // composes + registers all DB schemas
    EmailModule.forRoot({ provider: 'gmail', config: { ... } }),
    OpenKingdomFeatureBackendAuthModule.forRoot({ jwtSecret }),
    FeatureUserManagementModule.forRoot({
      invitationTokenSecret,
      frontendBaseUrl,
    }),
    FeatureGcpResourcesModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },  // global JWT protection
  ],
})
export class AppModule {}
```

### Frontend Root Store

```typescript
// See @open-kingdom/demo-scaffold-frontend-feature-root-store
// for the canonical store composition pattern
const store = createRootStore();

function Root() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <App />
        <NotificationToastContainer />
      </ThemeProvider>
    </Provider>
  );
}
```

## Nx Task Commands

```bash
# Run all tests
nx run-many --target=test

# Build specific library
nx build shared-backend-feature-authentication

# Lint affected files
nx affected --target=lint

# Generate OpenAPI specs
npm run swagger:generate-all

# Regenerate API client from OpenAPI
npm run client:generate-all

# Database operations
npm run db:generate    # generate Drizzle migrations
npm run db:migrate     # apply migrations
npm run db:push        # push schema directly (dev only)
npm run db:studio      # open Drizzle Studio
```

## Rules Index

Detailed rules for working in this codebase are in `.claude/rules/`:

- [`architecture.md`](rules/architecture.md) — library boundaries, dependency rules, NestJS patterns
- [`backend-patterns.md`](rules/backend-patterns.md) — NestJS module authoring, DI, Drizzle ORM
- [`frontend-patterns.md`](rules/frontend-patterns.md) — Redux Toolkit, RTK Query, React component conventions
- [`nx-conventions.md`](rules/nx-conventions.md) — Nx workspace conventions, project creation, task running
- [`code-generation.md`](rules/code-generation.md) — AI code generation guidelines and integration patterns
