# @open-kingdom/shared-poly-util-env-config

Type-safe, adapter-pattern environment variable service that works identically in Node.js (reads `process.env`) and Vite browser environments (reads `import.meta.env`). The `keys` array passed to `createConfigService` constrains which keys are valid at the TypeScript level — accessing an undeclared key is a compile error.

---

## Exports

| Export | Type | Description |
|---|---|---|
| `ConfigService<TKeys>` | `class` | Typed environment variable accessor |
| `createConfigService(keys, adapter)` | `function` | Factory that creates a `ConfigService<TKeys[number]>` from a keys array and an adapter |
| `EnvAdapter` | `type` | `{ get(key: string): string \| undefined }` — interface for reading env vars |
| `nodeEnvAdapter` | `EnvAdapter` | Reads from `process.env[key]` — use in NestJS / Node.js |
| `createBrowserEnvAdapter(importMeta)` | `(importMeta: { env: Record<string, string \| undefined> }) => EnvAdapter` | Factory for Vite browser environments — pass `import.meta` |

---

## ConfigService Methods

| Method | Parameters | Returns | Description |
|---|---|---|---|
| `get` | `key: TKeys` | `string \| undefined` | Returns env var or undefined if not set |
| `get` | `key: TKeys, defaultValue: string` | `string` | Returns env var with fallback default value |
| `getOrThrow` | `key: TKeys` | `string` | Returns env var or throws `Error(\`Environment variable ${key} is not set\`)` |
| `has` | `key: TKeys` | `boolean` | Returns true if the variable is set (not undefined) |

---

## Usage

### Backend (NestJS / Node.js)

```typescript
import {
  createConfigService,
  nodeEnvAdapter,
} from '@open-kingdom/shared-poly-util-env-config';

const config = createConfigService(
  ['PORT', 'JWT_SECRET', 'JWT_EXPIRES_IN', 'DB_FILENAME'] as const,
  nodeEnvAdapter
);

// With default value (return type: string):
const port = config.get('PORT', '3000');

// Without default (return type: string | undefined):
const filename = config.get('DB_FILENAME');

// Throws if not set:
const jwtSecret = config.getOrThrow('JWT_SECRET');

// Boolean check:
if (config.has('JWT_EXPIRES_IN')) {
  const expiry = config.get('JWT_EXPIRES_IN');
}

// TypeScript error — 'UNDEFINED_KEY' is not in the keys array:
// config.get('UNDEFINED_KEY'); // TS2345
```

### Frontend (Vite)

```typescript
import {
  createConfigService,
  createBrowserEnvAdapter,
} from '@open-kingdom/shared-poly-util-env-config';

const config = createConfigService(
  ['VITE_API_BASE_URL', 'VITE_APP_NAME'] as const,
  createBrowserEnvAdapter(import.meta)
);

const apiUrl = config.get('VITE_API_BASE_URL', 'http://localhost:3000');
const appName = config.getOrThrow('VITE_APP_NAME');
```

### In a NestJS module (factory pattern)

```typescript
import { Module } from '@nestjs/common';
import {
  createConfigService,
  nodeEnvAdapter,
} from '@open-kingdom/shared-poly-util-env-config';

const ENV_KEYS = ['PORT', 'JWT_SECRET', 'DATABASE_URL'] as const;

@Module({
  providers: [
    {
      provide: 'CONFIG',
      useValue: createConfigService(ENV_KEYS, nodeEnvAdapter),
    },
  ],
  exports: ['CONFIG'],
})
export class ConfigModule {}
```

---

## Type Safety Details

The `keys` parameter to `createConfigService` is typed as `readonly string[]`. The returned `ConfigService` is parameterized on `TKeys[number]` — the union of all key strings in the array. This means passing a key that was not declared in the original array is a compile-time error:

```typescript
const config = createConfigService(
  ['PORT', 'HOST'] as const,
  nodeEnvAdapter
);
// config is: ConfigService<'PORT' | 'HOST'>

config.get('PORT');   // OK
config.get('HOST');   // OK
config.get('REDIS');  // TypeScript error: Argument of type '"REDIS"' is not
                      // assignable to parameter of type '"PORT" | "HOST"'
```

The `_keys` parameter is prefixed with underscore in the implementation because it is used only for type inference — the runtime `ConfigService` does not validate keys against the array.

---

## Custom Adapter

Implement `EnvAdapter` to read from any source (e.g., a secrets manager, test fixtures). `EnvAdapter` is a plain object with a single `get(key: string): string | undefined` method.

```typescript
import type { EnvAdapter } from '@open-kingdom/shared-poly-util-env-config';
import { createConfigService } from '@open-kingdom/shared-poly-util-env-config';

const testAdapter: EnvAdapter = {
  get: (key) => ({ PORT: '4000', JWT_SECRET: 'test-secret' })[key],
};

const config = createConfigService(
  ['PORT', 'JWT_SECRET'] as const,
  testAdapter
);
```

---

## Testing

```bash
nx test shared-poly-util-env-config
```
