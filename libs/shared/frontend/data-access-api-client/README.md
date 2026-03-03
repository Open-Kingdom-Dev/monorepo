# @open-kingdom/shared-frontend-data-access-api-client

RTK Query base API instance with JWT auth header injection, auth state management (Redux slice), token persistence via a `StorageProvider`, and an adapter pattern for custom auth header formatting.

---

## Exports

### Base API

| Export          | Type         | Description                                          |
| --------------- | ------------ | ---------------------------------------------------- |
| `baseApi`       | `Api<...>`   | RTK Query `createApi` instance, `reducerPath: 'api'` |
| `ApiKey`        | `'api'`      | The reducer path string constant                     |
| `apiReducer`    | `Reducer`    | `baseApi.reducer` — add to store under `ApiKey`      |
| `apiMiddleware` | `Middleware` | `baseApi.middleware` — add to store middleware chain |

### Auth Slice

| Export                  | Type                                             | Description                                                             |
| ----------------------- | ------------------------------------------------ | ----------------------------------------------------------------------- |
| `authSlice`             | `Slice<AuthState>`                               | Redux slice, `name: 'auth'`                                             |
| `AuthKey`               | `'auth'`                                         | The slice name string constant                                          |
| `AuthState`             | `interface`                                      | `{ token: string \| null }`                                             |
| `AuthPersistence`       | `interface`                                      | `{ getToken(): string \| null; setToken(token: string \| null): void }` |
| `authReducer`           | `Reducer<AuthState>`                             | `authSlice.reducer`                                                     |
| `setToken`              | `ActionCreator<string \| null>`                  | Sets the JWT token in Redux state                                       |
| `logout`                | `ActionCreator<void>`                            | Clears token and resets RTK Query API state                             |
| `selectToken`           | `(state: { auth: AuthState }) => string \| null` | Selector for current token                                              |
| `selectIsAuthenticated` | `(state: { auth: AuthState }) => boolean`        | Selector for auth status                                                |

### Auth Listener Middleware

| Export                              | Type               | Description                                                                             |
| ----------------------------------- | ------------------ | --------------------------------------------------------------------------------------- |
| `configureAuth(config: AuthConfig)` | `function`         | Configures global persistence and logout callback — call before store creation          |
| `createAuthListenerMiddleware()`    | `() => Middleware` | RTK listener that persists token on `setToken`/`logout` and handles logout side effects |
| `createAuthHydrationMiddleware()`   | `() => Middleware` | Middleware that hydrates token from persistence on the first dispatched action          |
| `AuthConfig`                        | `interface`        | `{ persistence?: AuthPersistence; onLogout?: () => void }`                              |

### Auth Adapter

| Export                              | Type                                                 | Description                                                                                 |
| ----------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `AuthAdapter`                       | `interface`                                          | `{ prepareHeaders(headers: Headers, token: string): void }`                                 |
| `setAuthAdapter(adapter)`           | `(adapter: AuthAdapter \| null) => void`             | Registers a module-level custom adapter; replaces default `Authorization: Bearer` injection |
| `getAuthAdapter()`                  | `() => AuthAdapter \| null`                          | Returns the currently registered adapter                                                    |
| `createCustomHeaderAdapter(config)` | `(config: CustomHeaderAdapterConfig) => AuthAdapter` | Factory for adapters that set a named header                                                |
| `CustomHeaderAdapterConfig`         | `interface`                                          | `{ headerName: string; formatValue?: (token: string) => string }`                           |

### Token Persistence

| Export                              | Type                                                      | Description                                                                                            |
| ----------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `storagePersistence(storage, key?)` | `(storage: StorageLike, key?: string) => AuthPersistence` | Creates `AuthPersistence` backed by any `localStorage`-compatible storage; `key` defaults to `'token'` |

---

## Type Definitions

### `AuthState`

| Property | Type             | Required | Default | Description                                           |
| -------- | ---------------- | -------- | ------- | ----------------------------------------------------- |
| `token`  | `string \| null` | Yes      | —       | The current JWT token, or `null` when unauthenticated |

### `AuthPersistence`

| Method     | Parameters              | Returns          | Description                   |
| ---------- | ----------------------- | ---------------- | ----------------------------- |
| `getToken` | —                       | `string \| null` | Retrieves the persisted token |
| `setToken` | `token: string \| null` | `void`           | Persists or clears the token  |

### `AuthConfig`

| Property      | Type              | Required | Default | Description                                       |
| ------------- | ----------------- | -------- | ------- | ------------------------------------------------- |
| `persistence` | `AuthPersistence` | No       | —       | Storage backend for token persistence             |
| `onLogout`    | `() => void`      | No       | —       | Callback fired when `logout` action is dispatched |

### `AuthAdapter`

| Method           | Parameters                        | Returns | Description                                                |
| ---------------- | --------------------------------- | ------- | ---------------------------------------------------------- |
| `prepareHeaders` | `headers: Headers, token: string` | `void`  | Injects auth credentials into the outgoing request headers |

### `CustomHeaderAdapterConfig`

| Property      | Type                        | Required | Default           | Description                                      |
| ------------- | --------------------------- | -------- | ----------------- | ------------------------------------------------ |
| `headerName`  | `string`                    | Yes      | —                 | The HTTP header name to set (e.g. `'X-Api-Key'`) |
| `formatValue` | `(token: string) => string` | No       | Identity function | Transforms the raw token into the header value   |

### `StorageLike`

Any `localStorage`-compatible object that implements `getItem(key)`, `setItem(key, value)`, and `removeItem(key)`.

---

## Base API Behavior

- `baseUrl` reads `process.env.VITE_API_BASE_URL` (empty string `''` if unset)
- On every outgoing request, reads `state['auth'].token` from Redux state
- If a token is present:
  - If a custom `AuthAdapter` is registered via `setAuthAdapter()`, calls `adapter.prepareHeaders(headers, token)`
  - Otherwise, sets `Authorization: Bearer <token>` by default
- `endpoints` is empty (`endpoints: () => ({})`) — extended via `baseApi.injectEndpoints()` in generated code
- Generated endpoint hooks are auto-injected at import time via `import './lib/demo-scaffold-backend/api'` in `src/index.ts`

---

## Setup

### Store Registration

```typescript
import { configureStore } from '@reduxjs/toolkit';
import { ApiKey, apiReducer, apiMiddleware, AuthKey, authReducer, configureAuth, createAuthListenerMiddleware, createAuthHydrationMiddleware, storagePersistence } from '@open-kingdom/shared-frontend-data-access-api-client';

// Configure persistence BEFORE creating the store
configureAuth({
  persistence: storagePersistence(localStorage, 'auth_token'),
  onLogout: () => {
    window.location.href = '/login';
  },
});

export const store = configureStore({
  reducer: {
    [ApiKey]: apiReducer, // reducerPath: 'api'
    [AuthKey]: authReducer, // name: 'auth'
  },
  middleware: (getDefault) => getDefault().concat(apiMiddleware).concat(createAuthListenerMiddleware()).concat(createAuthHydrationMiddleware()),
});
```

---

## Usage Examples

### Dispatch login / set token

```typescript
import { setToken } from '@open-kingdom/shared-frontend-data-access-api-client';
import { useDispatch } from 'react-redux';

function LoginHandler() {
  const dispatch = useDispatch();

  async function handleLogin(email: string, password: string) {
    const response = await authApi.login({ email, password });
    dispatch(setToken(response.access_token));
  }
}
```

### Dispatch logout

```typescript
import { logout } from '@open-kingdom/shared-frontend-data-access-api-client';

// Clears token from Redux, resets all RTK Query cache, fires onLogout callback
dispatch(logout());
```

### Read auth state in components

```typescript
import { selectToken, selectIsAuthenticated } from '@open-kingdom/shared-frontend-data-access-api-client';
import { useSelector } from 'react-redux';

function AuthStatus() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const token = useSelector(selectToken);
  return <span>{isAuthenticated ? 'Logged in' : 'Logged out'}</span>;
}
```

### Custom auth header adapter

```typescript
import { createCustomHeaderAdapter, setAuthAdapter } from '@open-kingdom/shared-frontend-data-access-api-client';

// Set a custom header instead of the default Authorization: Bearer
setAuthAdapter(
  createCustomHeaderAdapter({
    headerName: 'X-Api-Key',
    formatValue: (token) => token, // raw value, no "Bearer" prefix
  })
);
```

### Custom AuthAdapter implementation

```typescript
import type { AuthAdapter } from '@open-kingdom/shared-frontend-data-access-api-client';
import { setAuthAdapter } from '@open-kingdom/shared-frontend-data-access-api-client';

const myAdapter: AuthAdapter = {
  prepareHeaders(headers, token) {
    headers.set('Authorization', `Token ${token}`);
    headers.set('X-Client-Version', '2.0.0');
  },
};

setAuthAdapter(myAdapter);
```

### Injecting endpoints (generated pattern)

```typescript
import { baseApi } from '@open-kingdom/shared-frontend-data-access-api-client';

// This pattern is used by the OpenAPI code generator plugin:
const extendedApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<User[], void>({
      query: () => '/users',
    }),
    createUser: builder.mutation<User, CreateUserDto>({
      query: (body) => ({ url: '/users', method: 'POST', body }),
    }),
  }),
});

export const { useGetUsersQuery, useCreateUserMutation } = extendedApi;
```

---

## Testing

```bash
nx test shared-frontend-data-access-api-client
```
