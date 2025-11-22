# @open-kingdom/shared-poly-util-env-config

Centralized configuration service for accessing environment variables. Works in both Node.js and browser environments.

## Usage

### Backend (Node.js)

```typescript
import { createConfigService, nodeEnvAdapter } from '@open-kingdom/shared-poly-util-env-config';

const envKeys = ['PORT', 'JWT_SECRET', 'JWT_EXPIRES_IN', 'BASE_URL'] as const;
const configService = createConfigService(envKeys, nodeEnvAdapter);

// Type-safe access to environment variables
const port = configService.get('PORT', '3000');
const secret = configService.getOrThrow('JWT_SECRET');
```

### Frontend (Vite)

```typescript
import { createConfigService, createBrowserEnvAdapter } from '@open-kingdom/shared-poly-util-env-config';

const envKeys = ['VITE_API_URL', 'VITE_APP_NAME'] as const;
const configService = createConfigService(envKeys, createBrowserEnvAdapter(import.meta));

const apiUrl = configService.get('VITE_API_URL');
```

## API

### `createConfigService(keys, adapter)`

Factory function to create a typed ConfigService instance.

- `keys`: Array of environment variable keys (used for type inference)
- `adapter`: Either `nodeEnvAdapter` or result of `createBrowserEnvAdapter(import.meta)`

### `createBrowserEnvAdapter(importMeta)`

Factory function to create a browser environment adapter.

- `importMeta`: Pass `import.meta` from your Vite app

### `ConfigService<TKeys>`

- `get(key)`: Returns the value or undefined
- `get(key, defaultValue)`: Returns the value or the default
- `getOrThrow(key)`: Returns the value or throws if not set
- `has(key)`: Returns true if the variable is set
