# @open-kingdom/demo-scaffold-frontend-feature-root-store

Configures and exports the complete Redux store for the demo-scaffold frontend application, composing all reducers and middleware from the shared library ecosystem.

## Purpose

This library is the single store-creation point for the demo-scaffold frontend. It wires every Redux slice, RTK Query API, and middleware into a fully configured store via `createRootStore()`. Use this as a reference implementation when building new applications on top of the shared libraries.

## Exports

- `createRootStore()` — factory function returning a fully configured Redux store

## Store Shape

The store produced by `createRootStore()` has the following reducer keys:

| Key                                   | Source Package                              | Description                     |
| ------------------------------------- | ------------------------------------------- | ------------------------------- |
| `'logger'` (`LoggerKey`)              | `shared-frontend-data-access-logger`        | Client-side log entries         |
| `'notifications'` (`NotificationKey`) | `shared-frontend-data-access-notifications` | UI notification queue           |
| `'datagrid'` (`DataGridKey`)          | `shared-frontend-ui-datagrid`               | AG Grid persisted state         |
| `'api'` (`ApiKey`)                    | `shared-frontend-data-access-api-client`    | RTK Query cache for backend API |
| `'auth'` (`AuthKey`)                  | `shared-frontend-data-access-api-client`    | JWT token and user identity     |
| `'catFactsApi'` (`CatFactsApiKey`)    | `shared-frontend-data-access-external-api`  | External API RTK Query cache    |

## Middleware Stack

Registered in order (prepended middleware runs first):

1. `createConsoleLoggerMiddleware()` — intercepts `console.log/warn/error` → dispatches to logger slice
2. `createHttpLoggerMiddleware()` — forwards log entries to server HTTP endpoint
3. `createAuthHydrationMiddleware()` — rehydrates JWT token from `localStorage` on startup
4. `apiMiddleware` — RTK Query cache management for backend API
5. `catFactsApiMiddleware` — RTK Query cache management for external API
6. `createAuthListenerMiddleware()` — persists token changes to `localStorage`
7. `createReduxRTKErrorMiddleware({ logAction, notifyAction })` — captures RTK errors, logs them and triggers error notifications

## Usage

```typescript
import { createRootStore } from '@open-kingdom/demo-scaffold-frontend-feature-root-store';
import { Provider } from 'react-redux';

const store = createRootStore();

function Root() {
  return (
    <Provider store={store}>
      <App />
    </Provider>
  );
}
```

## Inferring RootState and AppDispatch

```typescript
import { createRootStore } from '@open-kingdom/demo-scaffold-frontend-feature-root-store';

const store = createRootStore();
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

## Extending for New Applications

When building a new application, create a new store module and compose the slices you need:

```typescript
import { configureStore } from '@reduxjs/toolkit';
import { ApiKey, apiReducer, apiMiddleware, AuthKey, authReducer, createAuthListenerMiddleware, createAuthHydrationMiddleware } from '@open-kingdom/shared-frontend-data-access-api-client';
import { LoggerKey, loggerReducer, createConsoleLoggerMiddleware } from '@open-kingdom/shared-frontend-data-access-logger';
import { NotificationKey, notificationReducer } from '@open-kingdom/shared-frontend-data-access-notifications';

export const createRootStore = () =>
  configureStore({
    reducer: {
      [LoggerKey]: loggerReducer,
      [NotificationKey]: notificationReducer,
      [ApiKey]: apiReducer,
      [AuthKey]: authReducer,
      // add your feature slices here
    },
    middleware: (getDefault) => getDefault().prepend(createConsoleLoggerMiddleware()).prepend(createAuthHydrationMiddleware()).concat(apiMiddleware).concat(createAuthListenerMiddleware()),
  });
```

## Architecture Note

This library has no build step — consumed directly from source within the monorepo. It is not published to npm (`"private": true`).

## Testing

```bash
nx test demo-scaffold-frontend-feature-root-store
```
