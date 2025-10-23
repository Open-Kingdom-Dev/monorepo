# data-access-logger

This library provides data access infrastructure for logging functionality. It handles log persistence, transmission, and state management for application logging.

## Features

- Redux slice for log state management
- Action creators for different log levels (info, warn, error)
- Selectors for querying log data
- Middleware for side effects (console logging, custom handlers)
- TypeScript support with proper typing

## Usage

```typescript
import { logInfo, logWarn, logError, selectLogs } from '@open-kingdom/shared-frontend-data-access-logger';

// Dispatch log actions
dispatch(logInfo('User logged in'));
dispatch(logWarn('API rate limit approaching'));
dispatch(logError('Database connection failed'));

// Query log data
const logs = useSelector(selectLogs);
```

## Running unit tests

Run `nx test data-access-logger` to execute the unit tests via [Jest](https://jestjs.io).
