# Integration Test Doubles

A library for creating integration test doubles (fakes) for external services. Provides local twins that can be used in place of real services during testing.

## Features

- **GCS Twin**: Local fake for Google Cloud Storage using `fsouza/fake-gcs-server`
- **HTTP Interceptor**: Intercept and reroute HTTP/fetch requests to local twins
- **Configuration**: Environment-based configuration with sensible defaults
- **Lifecycle Management**: Start, stop, and reset twins programmatically

## Quick Start

### Using GCS Twin

```typescript
import { GcsTwin } from '@poly/integration-test-doubles';

// Start the twin
const twin = new GcsTwin();
await twin.start();

// Use the twin URL in your tests
const client = new Storage({
  apiEndpoint: twin.getEmulatorHost(),
});

// Run your tests...

// Clean up
await twin.stop();
```

### Using HTTP Interceptor

```typescript
import { HttpInterceptor } from '@poly/integration-test-doubles';

// Create and configure interceptor
const interceptor = new HttpInterceptor();
interceptor.addRule({
  from: 'https://storage.googleapis.com',
  to: 'http://localhost:9019', // Your twin URL
});

// Install the interceptor
await interceptor.install();

// All fetch/http requests to storage.googleapis.com are now routed to localhost:9019

// Clean up
await interceptor.uninstall();
```

### Combined Usage

```typescript
import { GcsTwin, HttpInterceptor } from '@poly/integration-test-doubles';

// Start twin and interceptor
const twin = new GcsTwin();
await twin.start();

const interceptor = new HttpInterceptor();
interceptor.addRule({
  from: 'https://storage.googleapis.com',
  to: twin.getEmulatorHost(),
});
await interceptor.install();

// Run tests - all GCS requests are automatically routed to the twin

// Clean up
await interceptor.uninstall();
await twin.stop();
```

## API Reference

### GcsTwin

#### Constructor

```typescript
constructor(config?: { port?: number; buckets?: string[] })
```

- `port`: Port to run the twin on (default: 9019, or from `GCS_TWIN_PORT` env var)
- `buckets`: Buckets to create and seed (default: ['app-assets'])

#### Methods

- `start()`: Start the twin container and seed buckets
- `stop()`: Stop and remove the container
- `reset()`: Reset the twin to its initial seeded state
- `getEmulatorHost()`: Get the twin URL (e.g., `http://localhost:9019`)
- `getInternalUrl()`: Get the internal Docker network URL
- `isHealthy()`: Check if the twin is running and responding

### HttpInterceptor

#### Constructor

```typescript
constructor(config?: { enabled?: boolean; verbose?: boolean; rules?: RoutingRule[] })
```

- `enabled`: Enable/disable interception (default: true)
- `verbose`: Enable verbose logging (default: false)
- `rules`: Initial routing rules

#### Methods

- `install()`: Install the interceptor
- `uninstall()`: Remove the interceptor
- `isHealthy()`: Check if the interceptor is installed
- `addRule(rule)`: Add a routing rule
- `removeRules(predicate)`: Remove rules matching a predicate
- `clearRules()`: Remove all rules

#### RoutingRule

```typescript
interface RoutingRule {
  from: string; // URL to intercept (e.g., 'https://storage.googleapis.com')
  to: string; // Twin URL to route to (e.g., 'http://localhost:9019')
}
```

### AgentInterceptor

Low-level HTTP/HTTPS agent interceptor. Usually used via `HttpInterceptor`.

```typescript
import { AgentInterceptor } from '@poly/integration-test-doubles';

const agentInterceptor = new AgentInterceptor();
agentInterceptor.setRules([...]);
agentInterceptor.install();
// ...
agentInterceptor.uninstall();
```

## Configuration

### Environment Variables

| Variable           | Description                      | Default                         |
| ------------------ | -------------------------------- | ------------------------------- |
| `GCS_TWIN_PORT`    | Port for GCS twin                | 9019                            |
| `GCS_TWIN_IMAGE`   | Docker image for fake-gcs-server | `fsouza/fake-gcs-server:latest` |
| `GCS_TWIN_ENABLED` | Enable/disable twins             | `true`                          |

### Port Range

The library reserves ports 9010-9020 for test doubles. Configure in `constants.ts` if you need to change this range.

## Scripts

### Start Twin Manually

```bash
# Start on default port
tsx scripts/start-twin.ts

# Start on specific port
tsx scripts/start-twin.ts 9019
```

The script outputs the twin URL and keeps running until Ctrl+C.

## Troubleshooting

### Docker Not Running

```
Error: connect ENOENT /var/run/docker.sock
```

**Solution**: Ensure Docker Desktop is running.

### Port Already in Use

```
Error: Port 9019 is already in use
```

**Solution**:

- Use a different port: `new GcsTwin({ port: 9020 })`
- Or set `GCS_TWIN_PORT=9020`

### Container Won't Start

```
Error: (HTTP code 404) not found - No such image: fsouza/fake-gcs-server:latest
```

**Solution**: Pull the image manually:

```bash
docker pull fsouza/fake-gcs-server:latest
```

### Interceptor Not Working

**Symptoms**: Requests not being rerouted.

**Solutions**:

1. Verify interceptor is installed: `interceptor.isHealthy()`
2. Check routing rules match the URL hostname exactly
3. Enable verbose logging: `new HttpInterceptor({ verbose: true })`
4. Ensure interceptor is installed before making requests

### Tests Fail When Run Together

**Symptoms**: Tests pass in isolation but fail in suite.

**Cause**: Port conflicts between tests.

**Solution**: Use unique ports for each test suite:

```typescript
const twin1 = new GcsTwin({ port: 9017 });
const twin2 = new GcsTwin({ port: 9018 });
```

## Architecture

### Components

```
┌─────────────────┐     ┌──────────────────┐
│  Your Code      │     │  GcsTwin         │
│  (fetch/http)   │────▶│  (fake-gcs-server)│
└─────────────────┘     └──────────────────┘
         │                       │
         ▼                       │
┌─────────────────┐             │
│ HttpInterceptor │─────────────┘
│ (reroutes to    │
│  local twin)    │
└─────────────────┘
```

### How It Works

1. **GcsTwin** starts a Docker container running `fsouza/fake-gcs-server`
2. **HttpInterceptor** overrides `globalThis.fetch` and Node's `http/https` modules
3. Requests matching routing rules are rewritten to the twin URL
4. Non-matching requests pass through unchanged

## License

MIT
