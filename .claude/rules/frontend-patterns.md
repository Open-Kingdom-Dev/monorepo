# Frontend Patterns (React + Redux Toolkit + RTK Query)

## Redux Store Structure

The canonical store shape uses one reducer key per domain, all defined as named constants:

```
store.auth          (AuthKey)           — JWT token, current user
store.api           (ApiKey)            — RTK Query cache (backend API)
store.logger        (LoggerKey)         — client-side log entries
store.notifications (NotificationKey)   — UI notification queue
store.datagrid      (DataGridKey)       — AG Grid persisted state
store.catFactsApi   (CatFactsApiKey)    — external API cache
```

Always use the exported `*Key` constants as reducer keys — never hardcode strings.

## Redux Slice Pattern

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface MyState {
  items: string[];
  loading: boolean;
}

const initialState: MyState = { items: [], loading: false };

export const mySlice = createSlice({
  name: 'my-feature',
  initialState,
  reducers: {
    addItem(state, action: PayloadAction<string>) {
      state.items.push(action.payload);
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
  },
});

export const { addItem, setLoading } = mySlice.actions;
export const MyKey = mySlice.name;
export const myReducer = mySlice.reducer;

// Selectors
export const selectItems = (state: { [MyKey]: MyState }) => state[MyKey].items;
```

## RTK Query — Extending the Base API

API endpoints are auto-generated from OpenAPI specs via `npm run client:generate-all`. The generated code injects endpoints into `baseApi` using `injectEndpoints`:

```typescript
import { baseApi } from '@open-kingdom/shared-frontend-data-access-api-client';

export const myApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getItems: builder.query<Item[], void>({
      query: () => '/items',
      providesTags: ['Item'],
    }),
    createItem: builder.mutation<Item, CreateItemDto>({
      query: (body) => ({ url: '/items', method: 'POST', body }),
      invalidatesTags: ['Item'],
    }),
  }),
});

export const { useGetItemsQuery, useCreateItemMutation } = myApi;
```

Never create a new `createApi()` instance for the backend — always use `baseApi.injectEndpoints()`.

## Auth State

Reading auth state in components:

```typescript
import { selectToken, selectUser } from '@open-kingdom/shared-frontend-data-access-api-client';
import { useSelector } from 'react-redux';

const token = useSelector(selectToken);
const user = useSelector(selectUser);
```

Dispatching auth actions:

```typescript
import { setToken, setUser, clearAuth } from '@open-kingdom/shared-frontend-data-access-api-client';
dispatch(setToken(token));
dispatch(clearAuth());
```

## Logging

```typescript
import { logInfo, logWarn, logError } from '@open-kingdom/shared-frontend-data-access-logger';
import { useDispatch } from 'react-redux';

const dispatch = useDispatch();
dispatch(logInfo('User action performed'));
dispatch(logError('Something failed'));
```

## Notifications

```typescript
import { addNotification } from '@open-kingdom/shared-frontend-data-access-notifications';

dispatch(
  addNotification({
    message: 'User created successfully',
    type: 'success',
    duration: 3000,
  })
);
```

## Theming

### Wrapping the App

```tsx
import { ThemeProvider } from '@open-kingdom/shared-frontend-ui-theme';

function Root() {
  return (
    <ThemeProvider>
      <App />
    </ThemeProvider>
  );
}
```

### Reading Theme in Components

```tsx
import { useTheme } from '@open-kingdom/shared-frontend-ui-theme';

function MyComponent() {
  const { mode, setMode } = useTheme();
  return <button onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}>Toggle</button>;
}
```

### Tailwind Color Classes

Always use semantic palette classes (`bg-primary-500`, `text-secondary-900`, `bg-success-100`, etc.) — never hardcoded hex values.

### Tailwind Config Inheritance

All app and library Tailwind configs must extend the base config:

```javascript
// tailwind.config.js
const baseConfig = require('@open-kingdom/shared-frontend-ui-theme/tailwind.config.js');
module.exports = {
  presets: [baseConfig],
  content: ['./src/**/*.{ts,tsx}', ...],
};
```

## DataGrid Component

```tsx
import { DataGrid, GridApi } from '@open-kingdom/shared-frontend-ui-datagrid';
import { useRef } from 'react';
import { ColDef } from 'ag-grid-community';

const colDefs: ColDef[] = [
  { field: 'id', headerName: 'ID' },
  { field: 'email', headerName: 'Email' },
];

function MyTable({ rows }: { rows: User[] }) {
  const gridRef = useRef<GridApi | null>(null);

  return <DataGrid ref={gridRef} columnDefs={colDefs} rowData={rows} mode="light" enableRowSelection enableStatePersistence storageKey="users-grid" />;
}
```

## Component File Conventions

- Export components from the library's `index.ts`
- Co-locate styles as Tailwind classes inline

## Error Boundary

Use the error boundary from `feature-error-autologger` to wrap critical UI sections:

```tsx
import { ErrorBoundary } from '@open-kingdom/shared-frontend-feature-error-autologger';

<ErrorBoundary fallback={<ErrorFallback />}>
  <CriticalComponent />
</ErrorBoundary>;
```

## Environment Variables (Frontend)

Use `@open-kingdom/shared-poly-util-env-config` for type-safe access:

```typescript
import { createConfigService, createBrowserEnvAdapter } from '@open-kingdom/shared-poly-util-env-config';

const config = createConfigService(['VITE_API_BASE_URL', 'VITE_APP_NAME'] as const, createBrowserEnvAdapter(import.meta));

export const API_BASE_URL = config.get('VITE_API_BASE_URL', 'http://localhost:3000');
```
