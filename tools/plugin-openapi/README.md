# @open-kingdom/plugin-openapi

Nx executors for generating NestJS OpenAPI documents and RTK Query clients.
The package is part of the `platform` release group, with public npm access.

## Consumer configuration

Install the plugin as a development dependency in the consuming Nx workspace.
The Nest application must provide its HTTP adapter (for example,
`@nestjs/platform-express`); the frontend provides Redux Toolkit, React, and
React Redux.

Add targets to an app or tooling project's Nx configuration:

```json
{
  "targets": {
    "swagger": {
      "executor": "@open-kingdom/plugin-openapi:swagger-generate-all"
    },
    "client": {
      "executor": "@open-kingdom/plugin-openapi:generate-all-client",
      "dependsOn": ["swagger"]
    }
  }
}
```

Backends are discovered under `apps/*/package.json` when `openapi` is `true`
or an object whose `enabled` field is not `false`. Each backend must export
`AppModule` from `dist/app/app.module.js` or `src/app/app.module.ts`. Generation
starts the Nest application without listening on a port, so its required
environment and services must be available. It closes the app afterward and
fails the target if any backend cannot be generated.

Optional `src/config/swagger.config.ts` exports `globalPrefix` and
`createSwaggerConfig`, returning a Nest `DocumentBuilder`. Otherwise the prefix
is `api` and a basic document title/version is used.

Schemas go into
`libs/shared/frontend/data-access-api-client/src/lib/<backend-slug>/openapi.json`.
The client executor scans that directory and generates `api.ts` alongside each
schema, plus an `index.ts`. Supply a `baseApi.ts` at the parent directory that
exports your single RTK Query `baseApi`; generated clients inject into it.
Use an app-owned module that re-exports the shared package's `baseApi` when
consuming the published API client library.

The client executor's optional `outputRoot` changes both schema discovery and
client output. Place schemas and `baseApi.ts` there before running that target;
it does not change where the Swagger executor writes schemas.

## Validation in this repository

```bash
npm run check:openapi
npm run test:openapi-package
```

The package smoke test builds and packs the plugin, installs the tarball in a
temporary consumer outside this workspace using locked dependency versions,
and runs both executors through Nx.
It checks generated hooks and types, custom client paths, and failure reporting.
It needs npm registry access and leaves the temporary consumer path in its
output for inspection. The test never publishes a package.
