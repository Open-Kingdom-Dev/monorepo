# Integration Test Doubles

A library for creating integration test doubles (fakes) for external services. Provides local twins that can be used in place of real services during testing and development.

## Features

- **GCS Twin**: Local fake for Google Cloud Storage using `fsouza/fake-gcs-server`
- **Configuration**: Environment-based configuration with sensible defaults and validation
- **Lifecycle Management**: Start, stop, and reset twins programmatically
- **NestJS Integration**: REST API controller for managing twins at runtime

## Quick Start

### Using GCS Twin

```typescript
import { GcsTwin } from '@open-kingdom/shared-backend-integration-test-doubles';

// Start the twin (default port 9013)
const twin = new GcsTwin();
await twin.start();

// GCS_EMULATOR_URL is automatically set to http://localhost:9013
// Use the twin URL in your SDK configuration
const client = new Storage({
  apiEndpoint: twin.getEmulatorHost(),
  projectId: 'emulator-project',
  credentials: {
    client_email: 'emulator@emulator.iam',
    private_key: 'unused',
  },
});

// Run your tests...

// Clean up (also unsets GCS_EMULATOR_URL)
await twin.stop();
```

### NestJS Integration

Use the `TwinService` to manage the twin lifecycle within a NestJS application:

```typescript
import { TwinService } from './twin/twin.service';

// The service wraps GcsTwin and exposes start/stop/status methods.
// See the demo-scaffold-backend app for a full controller example.
const twinService = new TwinService();
await twinService.start();
const status = await twinService.status();
await twinService.stop();
```

## API Reference

### GcsTwin

#### Constructor

```typescript
constructor(overrides?: Partial<GcsTwinConfig>, docker?: Docker)
```

- `overrides.port`: Port to run the twin on (default: 9013, or from `GCS_TWIN_PORT` env var; must be within 9010-9020)
- `overrides.externalUrl`: External URL for the twin (default: `http://localhost:{port}`)
- `overrides.dataDir`: Optional persistent data directory
- `overrides.buckets`: Buckets to create and seed (default: `[{ name: 'app-assets' }, { name: 'user-uploads' }]`)
- `docker`: Optional Docker instance (for testing)

Config merges defaults, environment variables, and explicit overrides (explicit overrides take precedence).

#### Methods

- `start()`: Start the twin container, create buckets, and set `GCS_EMULATOR_URL` env var
- `stop()`: Stop and remove the container, unset `GCS_EMULATOR_URL`
- `reset()`: Reset the twin to its initial seeded state
- `getEmulatorHost()`: Get the twin URL (e.g., `http://localhost:9013`)
- `isHealthy()`: Check if the twin is running and responding

#### GcsTwinConfig

```typescript
interface GcsTwinConfig {
  port: number; // Port the fake-gcs-server listens on
  externalUrl: string; // External URL for SDK configuration (e.g., http://localhost:9013)
  dataDir?: string; // Optional persistent data directory
  buckets: BucketConfig[]; // Buckets to create on startup
}

interface BucketConfig {
  name: string; // Bucket name
}
```

### Exports

```typescript
// GCS twin
export { GcsTwin } from './gcs/gcs-twin.js';
export type { GcsTwinConfig, BucketConfig } from './gcs/gcs-twin.config.js';
export { defaultGcsConfig } from './gcs/gcs-twin.config.js';

// Shared constants and utilities
export { PORT_RANGE, DEFAULT_PORTS, ENV_VARS } from './shared/constants.js';
export { isTestMode } from './shared/activation.js';
export { createGcsConfig, defaultGcsConfig } from './shared/config.js';
```

## Configuration

### Environment Variables

| Variable            | Description                           | Default                   |
| ------------------- | ------------------------------------- | ------------------------- |
| `GCS_TWIN_PORT`     | Port for GCS twin (must be 9010-9020) | 9013                      |
| `GCS_TWIN_DATA_DIR` | Persistent data directory (optional)  | (ephemeral)               |
| `GCS_EMULATOR_URL`  | Auto-set by `GcsTwin.start()`         | `http://localhost:{port}` |
| `TEST_MODE`         | Activation gate; must be `'true'`     | (unset)                   |

### Port Assignments

The library reserves ports 9010-9020 for test doubles:

| Twin            | Default Port  |
| --------------- | ------------- |
| GCS             | 9013          |
| Gmail           | 9014 (future) |
| Google Auth     | 9015 (future) |
| YouTube         | 9016 (future) |
| Google Calendar | 9017 (future) |
| Spotify         | 9018 (future) |

Configure in `constants.ts` if you need to change this range.

### How Configuration Merging Works

Configuration is resolved in this order (later takes precedence):

1. **Defaults** (`defaultGcsConfig`)
2. **Environment variables** (`GCS_TWIN_PORT`, `GCS_TWIN_DATA_DIR`)
3. **Explicit overrides** (passed to constructor or `createGcsConfig()`)

Port validation ensures the value is within the reserved range (9010-9020).

## Scripts

### Start Twin Manually

```bash
# Start on default port (9013)
npx tsx scripts/start-twin.ts

# Start on specific port
npx tsx scripts/start-twin.ts 9013
```

The script outputs the twin URL and sets `GCS_EMULATOR_URL`. Keeps running until Ctrl+C.

## Architecture

### Components

```
┌─────────────────┐     ┌────────────────────┐
│  NestJS App     │     │  GcsTwin            │
│  (GcsStorage    │────▶│  (fake-gcs-server   │
│   Service)      │     │   Docker container) │
└─────────────────┘     └────────────────────┘
```

### How It Works

1. **GcsTwin** starts a Docker container running `fsouza/fake-gcs-server`
2. `GCS_EMULATOR_URL` is automatically set in `process.env` on start and unset on stop
3. **GcsStorageService** (in `feature-gcp-resources`) reads `GCS_EMULATOR_URL` or `STORAGE_EMULATOR_HOST` and configures the Google Cloud Storage SDK with `apiEndpoint` pointing to the twin
4. When no emulator is configured, `GcsStorageService` falls back to real GCS with signed URLs

### Default Buckets

Two buckets are created by default:

- **app-assets** - Application static assets
- **user-uploads** - User-uploaded files

## Troubleshooting

### Docker Not Running

```
Error: connect ENOENT /var/run/docker.sock
```

**Solution**: Ensure Docker Desktop is running.

### Port Already in Use

```
Error: Port 9013 is already in use
```

**Solution**:

- Use a different port: `new GcsTwin({ port: 9014 })`
- Or set `GCS_TWIN_PORT=9014`

### Container Won't Start

```
Error: (HTTP code 404) not found - No such image: fsouza/fake-gcs-server:latest
```

**Solution**: Pull the image manually:

```bash
docker pull fsouza/fake-gcs-server
```

### Port Out of Range

```
Error: GCS twin port 9099 is outside the reserved range 9010-9020
```

**Solution**: Use a port within 9010-9020, or adjust `PORT_RANGE` in `constants.ts`.

### Tests Fail When Run Together

**Symptoms**: Tests pass in isolation but fail in suite.

**Cause**: Port conflicts between tests.

**Solution**: Use unique ports for each test suite:

```typescript
const twin1 = new GcsTwin({ port: 9013 });
const twin2 = new GcsTwin({ port: 9014 });
```

## License

MIT
