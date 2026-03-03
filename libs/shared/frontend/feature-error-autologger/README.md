# @open-kingdom/shared-frontend-feature-error-autologger

React feature library that automatically captures uncaught errors, unhandled promise rejections, and RTK Query rejected actions, routing them to configurable logger and notification callbacks.

---

## Exports

| Export | Type | Description |
|---|---|---|
| `ErrorBoundary` | `class Component` | React error boundary — catches render errors and calls logger/notification handlers |
| `useGlobalErrorListener` | hook | Attaches `window.error` and `unhandledrejection` listeners on mount; cleans up on unmount |
| `useErrorReporter` | hook | Returns a stable `report(error, options?)` function for manual error reporting |
| `createReduxRTKErrorMiddleware` | middleware factory | Redux middleware that intercepts `/rejected` RTK actions and dispatches Redux action creators |
| `createRTKErrorMiddleware` | middleware factory | Redux middleware variant that calls plain callbacks instead of dispatching action creators |

---

## Configuration

### `ErrorBoundaryProps`

| Property | Type | Required | Default | Description |
|---|---|---|---|---|
| `children` | `ReactNode` | Yes | — | Content to render |
| `fallback` | `ReactNode \| ((error: Error) => ReactNode)` | No | — | Rendered when an error is caught; accepts a render prop |
| `logger` | `(message: string) => void` | No | — | Called with the error message on catch |
| `notificationHandler` | `(message: string) => void` | No | — | Called with the user-facing message on catch |
| `userMessage` | `string` | No | `'Something went wrong. Please try again.'` | Message passed to `notificationHandler` |
| `notify` | `boolean` | No | `true` | Whether to call `notificationHandler` |
| `log` | `boolean` | No | `true` | Whether to call `logger` |
| `onError` | `(error: Error, errorInfo: ErrorInfo) => void` | No | — | Additional callback after the error is reported |

### `ErrorListenerConfig` (for `useGlobalErrorListener`)

| Property | Type | Required | Default | Description |
|---|---|---|---|---|
| `logger` | `(message: string) => void` | No | — | Called with the error message |
| `notificationHandler` | `(message: string) => void` | No | — | Called with the user-facing message |
| `notify` | `boolean` | No | `true` | Whether to call `notificationHandler` |
| `log` | `boolean` | No | `true` | Whether to call `logger` |
| `defaultMessage` | `string` | No | `'An unexpected error occurred'` | Fallback when the error has no message |

### `HandleErrorOptions` (per-call options for `useErrorReporter`)

| Property | Type | Required | Default | Description |
|---|---|---|---|---|
| `notify` | `boolean` | No | `true` | Whether to call `notificationHandler` |
| `log` | `boolean` | No | `true` | Whether to call `logger` |
| `userMessage` | `string` | No | — | Override the user-facing message |
| `context` | `Record<string, unknown>` | No | — | Additional context attached to the error |

### `ReduxRTKErrorMiddlewareConfig` (for `createReduxRTKErrorMiddleware`)

| Property | Type | Required | Default | Description |
|---|---|---|---|---|
| `logAction` | `(payload: { message: string; level: 'error' }) => Action` | Yes | — | Action creator dispatched for logging |
| `notifyAction` | `(message: string) => Action` | Yes | — | Action creator dispatched for notifications |
| `notify` | `boolean` | No | `true` | Whether to dispatch `notifyAction` |
| `log` | `boolean` | No | `true` | Whether to dispatch `logAction` |
| `defaultMessage` | `string` | No | — | Fallback message for errors without one |
| `shouldHandle` | `(action: unknown) => boolean` | No | — | Predicate to filter which rejected actions are handled |

---

## Usage

### ErrorBoundary

```tsx
import { ErrorBoundary } from '@open-kingdom/shared-frontend-feature-error-autologger';

function App() {
  const dispatch = useDispatch();
  return (
    <ErrorBoundary
      logger={(msg) => dispatch(logError(msg))}
      notificationHandler={(msg) => dispatch(showErrorNotification(msg))}
      fallback={(error) => <div>Something went wrong: {error.message}</div>}
    >
      <YourAppContent />
    </ErrorBoundary>
  );
}
```

### useGlobalErrorListener

```tsx
import { useGlobalErrorListener } from '@open-kingdom/shared-frontend-feature-error-autologger';

function AppRoot() {
  const dispatch = useDispatch();
  useGlobalErrorListener({
    logger: (msg) => dispatch(logError(msg)),
    notificationHandler: (msg) => dispatch(showErrorNotification(msg)),
  });
  return <App />;
}
```

### useErrorReporter

```tsx
import { useErrorReporter } from '@open-kingdom/shared-frontend-feature-error-autologger';

function DataFetcher() {
  const dispatch = useDispatch();
  const report = useErrorReporter({
    logger: (msg) => dispatch(logError(msg)),
  });

  const fetchData = async () => {
    try {
      await api.getData();
    } catch (err) {
      report(err, { notify: false, context: { component: 'DataFetcher' } });
    }
  };
}
```

### createReduxRTKErrorMiddleware (recommended for Redux apps)

```typescript
import { createReduxRTKErrorMiddleware } from '@open-kingdom/shared-frontend-feature-error-autologger';

configureStore({
  middleware: (getDefault) =>
    getDefault().concat(
      createReduxRTKErrorMiddleware({
        logAction: ({ message }) => logError(message),
        notifyAction: (message) => showErrorNotification(message),
      })
    ),
});
```

### createRTKErrorMiddleware (callback-based)

```typescript
import { createRTKErrorMiddleware } from '@open-kingdom/shared-frontend-feature-error-autologger';

const middleware = createRTKErrorMiddleware({
  logger: (msg) => console.error('[RTK Error]', msg),
  notificationHandler: (msg) => alert(msg),
});
```

---

## Testing

```bash
nx test shared-frontend-feature-error-autologger
```
