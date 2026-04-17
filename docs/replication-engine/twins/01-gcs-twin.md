# Implementation Guide: Google Cloud Storage Twin

## Summary

This is the first vertical slice of the integration test doubles library. It delivers a fully functional local GCS emulator integration with seed data, startup scripts, and environment configuration. Because Google's `@google-cloud/storage` SDK natively supports the `STORAGE_EMULATOR_HOST` environment variable, this twin requires **no custom server code and no network interception layer**. It establishes the foundational patterns (env-config, startup conventions, seed data management) that all subsequent twins will follow.

---

## 1. Goals

* Provide a local GCS emulator that exercises the full storage pipeline: upload, download, signed URLs, listing, deletion, and content hashing.
* Establish the project's conventions for twin startup, seed data, environment configuration, and error simulation.
* Require zero changes to application code — the SDK's built-in emulator support handles routing transparently.

---

## 2. Technology Choice

Use [fake-gcs-server](https://github.com/fsouza/fake-gcs-server) via Docker. This is a mature, well-maintained emulator that implements the GCS JSON and XML APIs with high fidelity.

### Docker Image

```
docker pull fsouza/fake-gcs-server
```

### Why Docker?

* `fake-gcs-server` is a Go binary distributed as a Docker image.
* Docker ensures consistent behavior across dev machines and CI environments.
* If Docker is unavailable, the Go binary can be installed directly as a fallback (document both paths).

---

## 3. Directory Structure

```
packages/integration-test-doubles/
  src/
    gcs/
      index.ts                  # Public API exports
      gcs-twin.ts               # Twin lifecycle management (start, stop, seed, reset)
      gcs-twin.config.ts        # Default configuration constants
      seed-data/
        sample-image-1.jpg      # Small sample image (~50KB)
        sample-image-2.png      # Small sample image (~50KB)
        sample-image-3.jpg      # Small sample image (~50KB)
      __tests__/
        gcs-twin.spec.ts        # Integration tests for the twin itself
  scripts/
    start-gcs-twin.sh           # Standalone startup script
```

---

## 4. Configuration

### 4.1 Environment Variables

| Variable | Purpose | Default |
| --- | --- | --- |
| `STORAGE_EMULATOR_HOST` | SDK-native variable that reroutes all GCS calls | `http://localhost:9013` |
| `GCS_TWIN_PORT` | Port for the fake-gcs-server | `9013` |
| `GCS_TWIN_SEED_DIR` | Path to seed data directory | `./src/gcs/seed-data` |
| `GCS_TWIN_DATA_DIR` | Persistent data directory (optional) | Temp directory (ephemeral) |

### 4.2 Activation Gate

The twin should only start when a configurable environment variable is truthy (e.g., `TEST_MODE=true`). Export a shared utility:

```
// src/shared/activation.ts
export function isTestMode(): boolean {
  return process.env.TEST_MODE === 'true';
}
```

This activation check is the library-wide convention. Every subsequent twin reuses it.

### 4.3 Configuration Object

```
// src/gcs/gcs-twin.config.ts
export interface GcsTwinConfig {
  port: number;
  externalUrl: string;       // URL the SDK will connect to
  seedDataDir: string;       // Path to seed files
  buckets: BucketSeedConfig[];
}

export interface BucketSeedConfig {
  name: string;
  seedFiles?: string[];      // Files from seedDataDir to pre-populate
}

export const defaultGcsConfig: GcsTwinConfig = {
  port: 9013,
  externalUrl: 'http://localhost:9013',
  seedDataDir: './src/gcs/seed-data',
  buckets: [
    {
      name: 'app-assets',
      seedFiles: ['sample-image-1.jpg', 'sample-image-2.png', 'sample-image-3.jpg'],
    },
    {
      name: 'user-uploads',
      // No seed files — populated by test flows
    },
  ],
};
```

---

## 5. Twin Lifecycle

### 5.1 Public API

```
// src/gcs/gcs-twin.ts
export class GcsTwin {
  constructor(config?: Partial<GcsTwinConfig>);

  /** Start the Docker container and seed initial data */
  async start(): Promise<void>;

  /** Stop and remove the Docker container */
  async stop(): Promise<void>;

  /** Reset all data to initial seed state (delete everything, re-seed) */
  async reset(): Promise<void>;

  /** Get the emulator host URL for SDK configuration */
  getEmulatorHost(): string;

  /** Check if the twin is running and healthy */
  async isHealthy(): Promise<boolean>;
}
```

### 5.2 Start Sequence

1. **Check for existing container.** If a container with the twin's name already exists, stop and remove it.
2. **Start Docker container:**

    ```
     docker run -d \
       --name fake-gcs-server \
       -p 9013:4443 \
       -v /tmp/gcs-twin-data:/data \
       fsouza/fake-gcs-server \
       -scheme http \
       -port 4443 \
       -external-url http://localhost:9013
    ```
3. **Wait for health.** Poll `GET http://localhost:9013/storage/v1/b` until it returns 200 (with timeout).
4. **Create buckets.** For each bucket in config, `POST /storage/v1/b` with `{ name: "<bucket>" }`.
5. **Upload seed files.** For each bucket with seed files, upload them using the GCS JSON API endpoint.
6. **Set environment variable.** Set `STORAGE_EMULATOR_HOST=http://localhost:9013` in `process.env`.

### 5.3 Stop Sequence

1. Stop the Docker container: `docker stop fake-gcs-server`
2. Remove the container: `docker rm fake-gcs-server`
3. Unset `STORAGE_EMULATOR_HOST` from `process.env`.

### 5.4 Reset Sequence

1. Delete all objects from all buckets.
2. Delete all buckets.
3. Re-create buckets and re-upload seed files (same as steps 4-5 of start).

This is exposed as both a programmatic method and a test control endpoint (see section 7).

---

## 6. Operations Covered

The twin must support these operations with sufficient fidelity for integration tests:

### 6.1 Upload

```
// Application code — unchanged, works against emulator transparently
const bucket = storage.bucket('user-uploads');
const file = bucket.file(`photos/${Date.now()}.jpg`);
await file.save(buffer, { contentType: 'image/jpeg' });
```

* Support `file.save()` with buffer content and metadata.
* Support timestamped path patterns.
* Return proper `generation` and `metageneration` fields.

### 6.2 Download

```
const [contents] = await bucket.file('photos/example.jpg').download();
const base64 = contents.toString('base64');
```

* Return the exact bytes that were uploaded.
* Support `file.download()` returning a Buffer.

### 6.3 Signed URLs

```
const [url] = await file.getSignedUrl({
  version: 'v4',
  action: 'read',
  expires: Date.now() + 15 * 60 * 1000,
});
```

* Generate signed URLs that resolve to the local emulator.
* The `external-url` flag on the Docker container ensures URLs point to `localhost:9013`.
* URLs must be functional — fetching them returns the file content.

### 6.4 List Files

```
const [files] = await bucket.getFiles({ prefix: 'photos/' });
```

* Support prefix filtering.
* Return file metadata (name, size, contentType, timeCreated).

### 6.5 Delete

```
await bucket.file('photos/old.jpg').delete();
```

* Remove the file from the emulator.
* Subsequent download/list should not include it.

### 6.6 Content Hashing

```
const [metadata] = await file.getMetadata();
const md5 = metadata.md5Hash;
```

* `fake-gcs-server` computes and stores MD5 and CRC32C hashes on upload.
* Consuming apps that use SHA256 for deduplication will compute it client-side from the downloaded buffer — no special twin support needed beyond faithful upload/download.

---

## 7. Test Control API

Expose a lightweight HTTP endpoint on the twin for test orchestration:

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/test/gcs/health` | GET | Returns 200 if emulator is running |
| `/test/gcs/reset` | POST | Reset all data to seed state |
| `/test/gcs/buckets/{name}/files` | GET | List all files in a bucket (for test assertions) |
| `/test/gcs/error-mode` | POST | Configure error simulation (see section 8) |

The test control API runs as a sidecar Express server on a separate port (e.g., `9113`) or as additional routes on a shared test control server. This pattern is reused by all subsequent twins.

---

## 8. Error Simulation

Error modes are activated via the test control API and deactivated on reset.

| Mode | Behavior |
| --- | --- |
| `bucket-not-found` | All operations on a specified bucket return 404 |
| `quota-exceeded` | All uploads return 403 with `quotaExceeded` reason |
| `permission-denied` | All operations return 403 with `forbidden` reason |
| `intermittent-failure` | N% of requests return 500 (configurable percentage) |

### API Shape

```
// Activate error mode
POST /test/gcs/error-mode
{
  "mode": "quota-exceeded",
  "config": {
    "bucket": "user-uploads"    // optional: scope to specific bucket
  }
}

// Deactivate error mode
DELETE /test/gcs/error-mode
```

### Implementation

Since `fake-gcs-server` has limited built-in error simulation, implement error modes in a thin proxy layer:

1. Start the proxy on port 9013.
2. Proxy forwards all requests to `fake-gcs-server` on an internal port (e.g., 9014).
3. When an error mode is active, the proxy intercepts matching requests and returns the configured error response before forwarding.
4. When no error mode is active, the proxy is transparent.

This proxy pattern is lightweight and avoids forking `fake-gcs-server`.

---

## 9. Startup Script

```
#!/bin/bash
# scripts/start-gcs-twin.sh

set -euo pipefail

CONTAINER_NAME="itd-gcs-twin"
PORT="${GCS_TWIN_PORT:-9013}"
INTERNAL_PORT=4443

echo "Starting GCS twin on port $PORT..."

# Clean up existing container
docker rm -f "$CONTAINER_NAME" 2>/dev/null || true

# Start fake-gcs-server
docker run -d \
  --name "$CONTAINER_NAME" \
  -p "$PORT:$INTERNAL_PORT" \
  fsouza/fake-gcs-server \
  -scheme http \
  -port "$INTERNAL_PORT" \
  -external-url "http://localhost:$PORT"

# Wait for health
for i in $(seq 1 30); do
  if curl -sf "http://localhost:$PORT/storage/v1/b" > /dev/null 2>&1; then
    echo "GCS twin healthy on port $PORT"
    exit 0
  fi
  sleep 0.5
done

echo "ERROR: GCS twin failed to start within 15 seconds"
docker logs "$CONTAINER_NAME"
exit 1
```

---

## 10. Conventions Established for Subsequent Twins

This first vertical slice sets the following patterns that all later twins must follow:

| Convention | Pattern |
| --- | --- |
| **Config object** | Typed interface with sensible defaults, partial override in constructor |
| **Lifecycle API** | `start()`, `stop()`, `reset()`, `isHealthy()` on every twin class |
| **Activation gate** | Shared `isTestMode()` check; twins refuse to start if not in test mode |
| **Test control API** | `/test/{twin}/health`, `/test/{twin}/reset`, `/test/{twin}/error-mode` |
| **Error simulation** | Mode-based, activated via HTTP, cleared on reset |
| **Seed data** | Declarative config listing seed files per resource, applied on start and reset |
| **Startup script** | Bash script in `scripts/`, idempotent (removes existing containers), health-waits |
| **Port assignment** | Each twin owns a port; documented in a central port map |
| **Environment variables** | Twin-specific vars with sensible defaults; shared routing table for intercepted twins |

---

## 11. Testing the Twin Itself

Write integration tests that verify the twin works correctly before consuming apps depend on it:

```
describe('GcsTwin', () => {
  let twin: GcsTwin;

  beforeAll(async () => {
    twin = new GcsTwin();
    await twin.start();
  });

  afterAll(async () => {
    await twin.stop();
  });

  beforeEach(async () => {
    await twin.reset();
  });

  it('should start and be healthy', async () => {
    expect(await twin.isHealthy()).toBe(true);
  });

  it('should have seed data in the assets bucket', async () => {
    const storage = new Storage({ apiEndpoint: twin.getEmulatorHost() });
    const [files] = await storage.bucket('app-assets').getFiles();
    expect(files.length).toBe(3);
  });

  it('should support upload and download round-trip', async () => {
    const storage = new Storage({ apiEndpoint: twin.getEmulatorHost() });
    const content = Buffer.from('test content');
    await storage.bucket('user-uploads').file('test.txt').save(content);
    const [downloaded] = await storage.bucket('user-uploads').file('test.txt').download();
    expect(downloaded).toEqual(content);
  });

  it('should generate functional signed URLs', async () => {
    const storage = new Storage({ apiEndpoint: twin.getEmulatorHost() });
    const file = storage.bucket('app-assets').file('sample-image-1.jpg');
    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 60_000,
    });
    const response = await fetch(url);
    expect(response.ok).toBe(true);
  });

  it('should reset to seed state', async () => {
    const storage = new Storage({ apiEndpoint: twin.getEmulatorHost() });
    await storage.bucket('user-uploads').file('extra.txt').save(Buffer.from('data'));
    await twin.reset();
    const [files] = await storage.bucket('user-uploads').getFiles();
    expect(files.length).toBe(0);
  });

  it('should simulate quota-exceeded errors', async () => {
    await fetch('http://localhost:9113/test/gcs/error-mode', {
      method: 'POST',
      body: JSON.stringify({ mode: 'quota-exceeded' }),
    });
    const storage = new Storage({ apiEndpoint: twin.getEmulatorHost() });
    await expect(
      storage.bucket('user-uploads').file('test.txt').save(Buffer.from('data'))
    ).rejects.toThrow(/quota/i);
  });
});
```

---

## 12. Checklist

* Docker container starts and is healthy within 15 seconds
* Buckets are created per configuration
* Seed files are uploaded to designated buckets
* Upload/download round-trip preserves exact bytes
* Signed URLs are functional and resolve to local emulator
* File listing with prefix filtering works
* File deletion works and is reflected in subsequent operations
* `reset()` returns all data to initial seed state
* Error simulation modes work (bucket-not-found, quota-exceeded, permission-denied, intermittent)
* `STORAGE_EMULATOR_HOST` is set/unset on start/stop
* Startup script is idempotent
* All twin integration tests pass
* Conventions documented for subsequent twins to follow

‌