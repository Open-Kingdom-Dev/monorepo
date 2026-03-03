# Code Generation Guidelines

## Purpose of this Monorepo

This monorepo is designed as a **toolkit for AI-assisted code generation**. When generating new features or applications, the goal is to compose existing libraries rather than rebuild primitives. Every new feature should be evaluated against what already exists before writing new code.

## Pre-generation Checklist

Before generating any code, answer:

1. **Does this feature need authentication?** → Use `OpenKingdomFeatureBackendAuthModule` + `JwtAuthGuard`
2. **Does this feature need users?** → Use `UsersService` from `data-access-users`
3. **Does this feature send emails?** → Use `EmailService` from `feature-email`
4. **Does this feature manage users/invitations?** → Use `FeatureUserManagementModule`
5. **Does this feature need database access?** → Define Drizzle schema, inject via `DB_TAG`
6. **Does the frontend need API calls?** → Extend `baseApi` with `injectEndpoints()`
7. **Does the frontend show tabular data?** → Use `DataGrid` from `ui-datagrid`
8. **Does the frontend need notifications?** → Use `addNotification` + `NotificationToastContainer`
9. **Does the frontend need theme-aware styling?** → Use `ThemeProvider` + `useTheme` + Tailwind palette classes

## Generating a New Full-Stack Feature

When scaffolding new libraries, follow the library creation process defined in `architecture.md`. That file covers scope, environment, type classification, naming, and the correct Nx generator commands to use. Do not create library directories manually.

Once the libraries exist, wire them together:

### Register Schema

Add new Drizzle tables to `libs/demo-scaffold/backend/feature-root-schema/src/lib/feature-root-schema.module.ts`:

```typescript
import { myTable } from '@open-kingdom/shared-backend-data-access-<name>';
const schema = { users, invitations, userRoles, myTable };
```

### Register Module in AppModule

```typescript
imports: [
  MyFeatureModule.forRoot({
    /* options */
  }),
];
```

### Generate OpenAPI Spec and API Client

```bash
npm run swagger:generate-all
npm run client:generate-all
```

`client:generate-all` generates RTK Query hooks into the `data-access-api-client` library.

## Naming Conventions

| Artifact           | Convention           | Example              |
| ------------------ | -------------------- | -------------------- |
| Redux slice        | camelCase            | `myFeatureSlice`     |
| Redux key constant | PascalCase + `Key`   | `MyFeatureKey`       |
| Injection token    | SCREAMING_SNAKE_CASE | `MY_FEATURE_OPTIONS` |

## What NOT to Generate

Do not regenerate these — they already exist:

- JWT authentication logic → use `feature-authentication`
- User CRUD → use `data-access-users` + `UsersService`
- Email sending → use `feature-email` + `EmailService`
- User invitation system → use `feature-user-management`
- Generic data grid → use `ui-datagrid` + `DataGrid`
- Toast notifications → use `feature-notifications` + `NotificationToastContainer`
- Theme system → use `ui-theme` + `ThemeProvider`
- Type-safe env config → use `poly-util-env-config` + `ConfigService`
- Database connection setup → use `data-access-database-setup` + `DatabaseSetupModule`

## Code Quality Rules

- All database interactions use Drizzle ORM — no raw SQL strings
- All public module members are exported from `src/index.ts`
- Schema table exports always include both `$inferSelect` and `$inferInsert` derived types

## Testing Standards

- Backend: Jest with NestJS test utilities (`Test.createTestingModule`)
- Frontend: Vitest with React Testing Library
- Mock database in tests using in-memory SQLite or mock the service directly
