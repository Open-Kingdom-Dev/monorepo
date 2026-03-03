# @open-kingdom/shared-frontend-data-access-logger

Redux-based client-side logging infrastructure providing a slice for storing log entries in state, action creators for different log levels, parameterized selectors, and two RTK listener middleware factories — one that mirrors logs to the browser console and one that POSTs logs to a remote endpoint via a configurable callback.

---

## Exports

### Slice

| Export | Type | Description |
|---|---|---|
| `loggerSlice` | `Slice<LoggerState>` | Redux slice, `name: 'logger'` |
| `loggerReducer` | `Reducer<LoggerState>` | `loggerSlice.reducer` — add to store under `LoggerKey` |
| `addLog` | `ActionCreator<Omit<LogEntry, 'id' \| 'timestamp'>>` | Low-level action to add a log entry (id and timestamp are auto-generated) |
| `clearLogs` | `ActionCreator<void>` | Removes all log entries from state |

### Actions (convenience helpers)

| Export | Type | Description |
|---|---|---|
| `logInfo(message: string)` | `() => Action` | Dispatches `addLog` with `level: 'info'` |
| `logWarn(message: string)` | `() => Action` | Dispatches `addLog` with `level: 'warn'` |
| `logError(message: string)` | `() => Action` | Dispatches `addLog` with `level: 'error'` |

### Selectors

| Export | Type | Description |
|---|---|---|
| `selectLoggerState` | `(state: RootStateContainingLogger) => LoggerState` | Selects the full logger slice |
| `selectLogs` | `(state: RootStateContainingLogger) => LogEntry[]` | Selects all log entries |
| `selectLogsByLevel` | `(state, level: 'info' \| 'warn' \| 'error') => LogEntry[]` | Selects entries filtered by level |
| `selectRecentLogs` | `(state, count: number) => LogEntry[]` | Selects the last `count` entries; returns `[]` if `count === 0` |

### Middleware

| Export | Type | Description |
|---|---|---|
| `createConsoleLoggerMiddleware()` | `() => Middleware` | RTK listener middleware that mirrors each `addLog` dispatch to `console.info/warn/error` |
| `createHttpLoggerMiddleware(config?)` | `(config?: HttpLoggerConfig) => Middleware` | RTK listener middleware that calls `config.onSend` for each `addLog` dispatch |

### Types

| Export | Type | Description |
|---|---|---|
| `LoggerKey` | `'logger'` | String constant for the reducer path |
| `LogEntry` | `interface` | Shape of a stored log entry |
| `LoggerState` | `interface` | Shape of the logger slice state |
| `RootStateContainingLogger` | `type` | Type helper for typed selectors: `{ [key: string]: unknown } & { logger: LoggerState }` |
| `HttpLoggerConfig` | `interface` | Config for `createHttpLoggerMiddleware` |
| `LogPayload` | `type` | `Omit<LogEntry, 'id' \| 'timestamp'>` — the shape sent to `onSend` |
| `AppDispatch` | `type` | `ThunkDispatch<unknown, unknown, UnknownAction>` — passed to `onSend` |

---

## Type Definitions

### `LogEntry`

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes (auto) | Auto-generated from `Date.now().toString()` |
| `message` | `string` | Yes | The log message text |
| `level` | `'info' \| 'warn' \| 'error'` | Yes | Severity level |
| `timestamp` | `number` | Yes (auto) | Auto-generated from `Date.now()` |

### `LoggerState`

| Property | Type | Description |
|---|---|---|
| `logs` | `LogEntry[]` | All stored log entries |

### `HttpLoggerConfig`

| Property | Type | Required | Default | Description |
|---|---|---|---|---|
| `onSend` | `(logEntry: LogPayload, dispatch?: AppDispatch) => void \| Promise<void>` | No | — | Called for each log entry dispatched to the store. If not provided, logs are only stored in Redux (no HTTP sending) |
| `onError` | `(error: unknown, logEntry: LogPayload) => void` | No | Silent | Called when `onSend` throws. If not provided, errors are silently ignored to prevent infinite error-logging loops |

---

## Setup

### Store Registration

```typescript
import { configureStore } from '@reduxjs/toolkit';
import {
  LoggerKey,
  loggerReducer,
  createConsoleLoggerMiddleware,
  createHttpLoggerMiddleware,
} from '@open-kingdom/shared-frontend-data-access-logger';

export const store = configureStore({
  reducer: {
    [LoggerKey]: loggerReducer, // 'logger'
  },
  middleware: (getDefault) =>
    getDefault()
      // Mirror logs to browser console:
      .concat(createConsoleLoggerMiddleware())
      // Send logs to a remote API endpoint:
      .concat(
        createHttpLoggerMiddleware({
          onSend: async (log) => {
            await fetch('/api/logs', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(log),
            });
          },
          onError: (error, log) => {
            console.error('Failed to send log', error, log);
          },
        })
      ),
});
```

---

## Usage Examples

### Dispatching logs

```typescript
import {
  logInfo,
  logWarn,
  logError,
} from '@open-kingdom/shared-frontend-data-access-logger';
import { useDispatch } from 'react-redux';

function MyComponent() {
  const dispatch = useDispatch();

  const handleLogin = () => {
    dispatch(logInfo('User logged in successfully'));
  };

  const handleApiError = (err: unknown) => {
    dispatch(logError(`API call failed: ${String(err)}`));
  };

  const handleSlowRequest = () => {
    dispatch(logWarn('Request taking longer than expected'));
  };
}
```

### Reading logs from state

```typescript
import {
  selectLogs,
  selectLogsByLevel,
  selectRecentLogs,
} from '@open-kingdom/shared-frontend-data-access-logger';
import { useSelector } from 'react-redux';

function LogViewer() {
  const allLogs = useSelector(selectLogs);
  const errorLogs = useSelector((state) => selectLogsByLevel(state, 'error'));
  const last10 = useSelector((state) => selectRecentLogs(state, 10));
}
```

### HTTP logging with RTK Query dispatch

```typescript
import { createHttpLoggerMiddleware } from '@open-kingdom/shared-frontend-data-access-logger';
import { myLoggingApi } from './my-logging-api';

createHttpLoggerMiddleware({
  onSend: (log, dispatch) => {
    // dispatch is the Redux ThunkDispatch — use with RTK Query mutations:
    dispatch?.(myLoggingApi.endpoints.sendLog.initiate(log));
  },
});
```

### Low-level `addLog` action

```typescript
import { addLog } from '@open-kingdom/shared-frontend-data-access-logger';

// addLog accepts Omit<LogEntry, 'id' | 'timestamp'>
dispatch(addLog({ message: 'Custom log entry', level: 'info' }));
```

---

## Console Middleware Behavior

`createConsoleLoggerMiddleware()` listens for `addLog` actions and calls the corresponding console method:

| Level | Console method | Format |
|---|---|---|
| `'info'` | `console.info` | `[INFO] <message>` |
| `'warn'` | `console.warn` | `[WARN] <message>` |
| `'error'` | `console.error` | `[ERROR] <message>` |

---

## Testing

```bash
nx test shared-frontend-data-access-logger
```
