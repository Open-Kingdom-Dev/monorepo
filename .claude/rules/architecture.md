# Architecture Rules

## Library Boundary Enforcement

Libraries are categorized by environment and type. Imports must respect these boundaries:

```
poly → (no monorepo imports)
backend → poly only
frontend → poly only
feature → data-access (same env) + poly
ui → (no data-access imports, no feature imports)
data-access → (no feature imports, no ui imports)
```

**Allowed dependency graph:**
- `backend/feature-*` → `backend/data-access-*`, `shared/poly/*`
- `backend/data-access-*` → `shared/poly/*`
- `frontend/feature-*` → `frontend/data-access-*`, `frontend/ui-*`, `shared/poly/*`
- `frontend/ui-*` → `shared/poly/*` (no Redux, no feature logic)
- `frontend/data-access-*` → `shared/poly/*`
- `shared/poly/*` → no other `@open-kingdom/*` imports

**Never:**
- Import `frontend` packages from `backend`
- Import `backend` packages from `frontend`
- Import `feature` packages from `data-access` or `ui`
- Import `data-access` packages from `ui`

## Library Type Definitions

| Type | Naming Pattern | Responsibility |
|---|---|---|
| `data-access` | `data-access-<name>` | Persistence, state slices, API clients |
| `feature` | `feature-<name>` | User-facing business logic, orchestration |
| `ui` | `ui-<name>` | Presentational components, no business logic |
| `util` | `util-<name>` | Pure functions, types, constants |

## Creating New Libraries

When adding a new library to this workspace:

1. Determine scope: `shared` (reusable) or app-specific (e.g., `demo-scaffold`)
2. Determine environment: `backend`, `frontend`, or `poly`
3. Determine type: `feature`, `data-access`, `ui`, or `util`
4. Name: `libs/<scope>/<env>/<type>-<name>/`
5. Package name: `@open-kingdom/<scope>-<env>-<type>-<name>`

Use the Nx generator to scaffold:
```bash
nx g @nx/nest:library --name=<type>-<name> --directory=libs/shared/backend/<type>-<name>
nx g @nx/react:library --name=<type>-<name> --directory=libs/shared/frontend/<type>-<name>
```

## Schema Composition Pattern

The backend uses a **schema composition module** to collect all Drizzle table definitions:

- Each `data-access` library exports its Drizzle table schema object
- Each `feature` library that owns tables exports those schema objects
- The app-level `feature-root-schema` module collects all schemas and calls `DatabaseSetupModule.register({ schema })`
- No library should call `DatabaseSetupModule.register()` except the root schema module

When adding a new feature with database tables:
1. Define tables in the `data-access` or `feature` library using Drizzle
2. Export the table from the library's `index.ts`
3. Import and add to the schema object in `feature-root-schema`
4. Run `npm run db:generate` and `npm run db:migrate`

## Service Injection Tokens

Database injection token: `DB_TAG` from `@open-kingdom/shared-poly-util-constants`

```typescript
import { DB_TAG } from '@open-kingdom/shared-poly-util-constants';

@Injectable()
class MyService {
  constructor(@Inject(DB_TAG) private db: BetterSQLite3Database<typeof schema>) {}
}
```

Always use `DB_TAG` — never hardcode the string `'DB'` or `'DB_DEV'`.

## Global vs Scoped Modules

- `EmailModule` is `global: true` — register once in `AppModule`, `EmailService` is injectable everywhere
- All other modules are scoped — import explicitly where needed
- `JwtAuthGuard` should be registered globally via `APP_GUARD` in `AppModule`
- Use `@Public()` decorator on specific endpoints that bypass JWT auth
