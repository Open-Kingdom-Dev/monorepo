# Nx Workspace Conventions

## Running Tasks

Always run tasks through the npm scripts defined in the root `package.json`, which delegate to Nx internally. Never invoke the underlying tools (Jest, tsc, ESLint, etc.) directly.

```bash
npm test                  # all tests with coverage
npm run test:affected     # tests for affected projects only
npm run typecheck         # typecheck all projects
npm run typecheck:affected
npm run lint              # lint all projects
npm run lint:fix
npm run format:fix
npm run build-all
npm run check-all         # typecheck + lint + format + test + e2e
npm run dev               # start frontend dev server
npm run dev:backend       # start backend dev server
```

When a task is not covered by a root npm script, add one to the root `package.json` before running it. This keeps all entry points discoverable in one place and makes automation consistent.

```json
"scripts": {
  "test:auth": "nx test shared-backend-feature-authentication"
}
```

Only invoke Nx directly for one-off diagnostic commands (e.g. `nx graph`, `nx affected --print-affected`) that don't warrant a permanent script.

## Project Names

Project names in Nx are derived from the directory structure, not the package name. Examples:

| Directory | Nx project name | npm package name |
|---|---|---|
| `libs/shared/backend/feature-authentication` | `shared-backend-feature-authentication` | `@open-kingdom/shared-backend-feature-authentication` |
| `libs/shared/frontend/ui-datagrid` | `shared-frontend-ui-datagrid` | `@open-kingdom/shared-frontend-ui-datagrid` |
| `libs/demo-scaffold/backend/feature-root-schema` | `demo-scaffold-backend-feature-root-schema` | `@open-kingdom/demo-scaffold-backend-feature-root-schema` |

## Library Generation

Generate new libraries using Nx generators (adjust generator based on env):

```bash
# NestJS library
nx g @nx/nest:library \
  --name=feature-my-feature \
  --directory=libs/shared/backend/feature-my-feature \
  --buildable

# React library
nx g @nx/react:library \
  --name=ui-my-component \
  --directory=libs/shared/frontend/ui-my-component \
  --bundler=vite \
  --unitTestRunner=vitest

# TypeScript utility library
nx g @nx/js:library \
  --name=util-my-util \
  --directory=libs/shared/poly/util-my-util \
  --bundler=swc
```

After generation, update `package.json` with:
- `"name": "@open-kingdom/<scope>-<env>-<type>-<name>"`
- `"version": "0.0.2-14"` (match current workspace version)
- `"publishConfig": { "access": "public" }`

## Project Configuration (`project.json`)

Every library has a `project.json` defining its Nx targets. Standard targets:
- `build` — compiles the library
- `test` — runs unit tests (Jest or Vitest)
- `lint` — ESLint
- `typecheck` — `tsc --noEmit`

## Caching

Nx caches task outputs. Cached by default: `build`, `test`, `lint`, `typecheck`.

To force a fresh run (bypass cache):
```bash
nx test my-project --skip-nx-cache
```

## Task Dependencies

Build order is enforced by `"dependsOn": ["^build"]` in `nx.json` target defaults. Running `nx build my-app` will automatically build all library dependencies first.

## Versioning and Publishing

The workspace uses conventional commits for automated versioning:
- `feat:` → minor bump
- `fix:` → patch bump
- `BREAKING CHANGE:` → major bump

All published libraries (under `libs/shared/`) share the same version (`0.0.2-14` at time of writing).

App-specific libraries (`libs/demo-scaffold/`) have `"private": true` and are not published.

## Workspace Graph

View the dependency graph:
```bash
nx graph
```

Useful for verifying that library boundaries are respected before committing.

## MCP Tools Available

When working in this workspace with Claude Code, the following MCP tools are available:
- `nx_workspace` — get overall workspace architecture and errors
- `nx_project_details` — get a specific project's config and dependencies
- `nx_docs` — search Nx documentation

Use these tools when diagnosing Nx configuration issues.
