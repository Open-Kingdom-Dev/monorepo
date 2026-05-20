/**
 * GCS error mode simulation — pure state management and request matching.
 *
 * The GcsErrorModeManager knows nothing about HTTP, NestJS, or networking.
 * It holds the currently active error mode, matches incoming requests against
 * the mode's criteria, and returns the appropriate GCS-shaped error response.
 *
 * Design decisions:
 * - Single-mode constraint: only one error mode can be active at a time.
 *   setMode() replaces any existing mode.
 * - Intermittent-failure uses a deterministic counter (every Nth request fails),
 *   not random percentage, for reproducible test results.
 * - reset() and clearMode() clear the mode and counter, ensuring no leakage
 *   between test runs.
 */

// ---------------------------------------------------------------------------
// Type definitions
// ---------------------------------------------------------------------------

/**
 * The four supported GCS error simulation modes.
 */
export type GcsErrorModeType =
  | 'bucket-not-found'
  | 'quota-exceeded'
  | 'permission-denied'
  | 'intermittent-failure';

/**
 * Configuration for bucket-not-found mode.
 * Matches requests targeting a specific bucket name.
 */
export interface BucketNotFoundConfig {
  type: 'bucket-not-found';
  /** The bucket name that will trigger the 404 response. */
  bucketName: string;
}

/**
 * Configuration for quota-exceeded mode.
 * Matches upload/create operations (POST to upload paths).
 */
export interface QuotaExceededConfig {
  type: 'quota-exceeded';
}

/**
 * Configuration for permission-denied mode.
 * Matches all GCS data operations.
 */
export interface PermissionDeniedConfig {
  type: 'permission-denied';
}

/**
 * Configuration for intermittent-failure mode.
 * Every Nth request fails with 500, deterministic counter.
 */
export interface IntermittentFailureConfig {
  type: 'intermittent-failure';
  /** Fail every Nth request. Defaults to 2 (every other request). */
  every?: number;
}

/**
 * Discriminated union of all error mode configurations.
 * The `type` field discriminates which kind of mode is active.
 */
export type GcsErrorModeConfig =
  | BucketNotFoundConfig
  | QuotaExceededConfig
  | PermissionDeniedConfig
  | IntermittentFailureConfig;

/**
 * A GCS-shaped error response that the NestJS interceptor will use
 * to short-circuit matching requests.
 */
export interface GcsErrorSimulationResult {
  /** HTTP status code to respond with. */
  status: number;
  /** GCS-shaped JSON error body. */
  body: {
    error: {
      code: number;
      message: string;
      errors: Array<{
        domain: string;
        reason: string;
        message?: string;
      }>;
    };
  };
}

// ---------------------------------------------------------------------------
// GCS error response factory
// ---------------------------------------------------------------------------

/** Creates a standard GCS error response shape. */
function gcsError(
  status: number,
  message: string,
  reason: string,
  detailMessage?: string
): GcsErrorSimulationResult {
  return {
    status,
    body: {
      error: {
        code: status,
        message,
        errors: [
          {
            domain: 'global',
            reason,
            message: detailMessage ?? message,
          },
        ],
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Request-matching helpers
// ---------------------------------------------------------------------------

/**
 * Extract the bucket name from a GCS API path.
 *
 * Supports both path-style and virtual-hosted-style paths:
 * - `/storage/v1/b/my-bucket/o` → "my-bucket"
 * - `/storage/v1/b/my-bucket` → "my-bucket"
 * - `/upload/storage/v1/b/my-bucket/o` → "my-bucket"
 * - `/download/storage/v1/b/my-bucket/o` → "my-bucket"
 * - `/b/my-bucket/o` → "my-bucket"
 *
 * Returns undefined if the path doesn't match any known GCS pattern.
 */
export function extractBucketName(path: string): string | undefined {
  // Strip leading slash for consistent processing
  const normalized = path.startsWith('/') ? path.slice(1) : path;

  // Match /api/gcs/files?bucket=<name> (query-string style)
  const apiGcsBucketMatch = normalized.match(
    /api\/gcs\/files[?&]bucket=([^&]+)/
  );
  if (apiGcsBucketMatch) {
    return decodeURIComponent(apiGcsBucketMatch[1]);
  }

  // Match /api/gcs/files/<bucket>/<name>/... or /api/gcs/files/<bucket>/<name>
  const apiGcsPathMatch = normalized.match(/api\/gcs\/files\/([^/]+)/);
  if (apiGcsPathMatch) {
    return decodeURIComponent(apiGcsPathMatch[1]);
  }

  // Match /api/gcs/upload (uses query param or default bucket — derive from body is not possible here)
  // Uploads via /api/gcs/upload use the bucket in the request body, not URL. Return undefined for now.

  // Match patterns with optional prefixes (upload/, download/) followed by
  // the GCS API path structure.
  const patterns = [
    // Full v1 API paths: storage/v1/b/{bucket}/... or upload/storage/v1/b/{bucket}/...
    /(?:upload\/|download\/)?storage\/v1\/b\/([^/]+)/,
    // Short form: b/{bucket}/...
    /b\/([^/]+)/,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return undefined;
}

/**
 * Determine if a request is an upload/create operation.
 *
 * Upload operations are POST requests to paths containing "/upload/" or
 * POST requests to bucket or object creation endpoints.
 */
export function isUploadOperation(method: string, path: string): boolean {
  if (method.toUpperCase() !== 'POST') return false;

  const normalized = path.toLowerCase();

  // /api/gcs/upload — the NestJS GCS upload endpoint
  if (normalized.includes('/api/gcs/upload')) return true;

  // /api/gcs/files/<bucket>/<name>/delete — treated as a write operation for permission-denied
  // (not an upload, but this function is specifically for quota-exceeded which targets uploads)

  // Direct upload path prefix (GCS native)
  if (normalized.includes('/upload/storage/')) return true;

  // Object insert via bucket's objects collection
  // POST /storage/v1/b/{bucket}/o
  if (normalized.includes('/b/') && normalized.includes('/o')) return true;

  // Bucket creation
  // POST /storage/v1/b
  if (normalized.match(/\/storage\/v1\/b\/?$/)) return true;

  return false;
}

/**
 * Determine if a request is a GCS data operation.
 *
 * GCS data operations include CRUD on buckets and objects.
 * They exclude twin control endpoints (/api/twin/...) and health checks.
 */
export function isGcsDataOperation(method: string, path: string): boolean {
  const normalized = path.toLowerCase();

  // Exclude twin control endpoints
  if (normalized.startsWith('/api/twin')) return false;

  // Exclude error-mode control endpoints (control plane, not data plane)
  if (normalized.startsWith('/api/gcs/error-mode')) return false;

  // Exclude health checks and non-GCS paths
  if (
    normalized === '/' ||
    normalized === '/health' ||
    normalized === '/healthz'
  ) {
    return false;
  }

  // NestJS GCS controller routes: /api/gcs/*
  if (normalized.startsWith('/api/gcs')) return true;

  // Include known GCS API paths
  if (normalized.includes('/storage/v1/')) return true;
  if (normalized.includes('/upload/storage/')) return true;
  if (normalized.includes('/download/storage/')) return true;

  // Include paths that match GCS bucket/object patterns
  if (normalized.match(/\/b\/[^/]+/)) return true;

  return false;
}

// ---------------------------------------------------------------------------
// GcsErrorModeManager
// ---------------------------------------------------------------------------

/**
 * Pure state manager for GCS error simulation modes.
 *
 * Tracks the active error mode and matches incoming requests against it.
 * Returns null for pass-through when no mode is active.
 *
 * Thread-safety: this class is NOT thread-safe. In NestJS, requests are
 * handled concurrently, so the counter for intermittent-failure mode must
 * be managed with atomic operations or a mutex in the interceptor layer.
 * For now, we use a simple counter since NestJS interceptors run on the
 * event loop and the matching logic is synchronous.
 */
export class GcsErrorModeManager {
  private activeMode: GcsErrorModeConfig | null = null;
  private requestCounter = 0;

  /**
   * Activate an error mode. Replaces any existing mode (single-mode constraint).
   * Resets the request counter for intermittent-failure mode.
   */
  setMode(config: GcsErrorModeConfig): void {
    this.activeMode = config;
    this.requestCounter = 0;
  }

  /**
   * Deactivate the current error mode. Returns to pass-through.
   * Resets the request counter.
   */
  clearMode(): void {
    this.activeMode = null;
    this.requestCounter = 0;
  }

  /**
   * Get the currently active error mode configuration.
   * Returns null when no mode is active (pass-through).
   */
  getMode(): GcsErrorModeConfig | null {
    return this.activeMode;
  }

  /**
   * Match an incoming request against the active error mode.
   *
   * @param method - HTTP method (GET, POST, PUT, DELETE, etc.)
   * @param path - Request path (e.g., /storage/v1/b/my-bucket/o)
   * @returns GcsErrorSimulationResult if the request matches, null for pass-through
   */
  matchRequest(method: string, path: string): GcsErrorSimulationResult | null {
    if (!this.activeMode) return null;

    switch (this.activeMode.type) {
      case 'bucket-not-found':
        return this.matchBucketNotFound(method, path, this.activeMode);
      case 'quota-exceeded':
        return this.matchQuotaExceeded(method, path, this.activeMode);
      case 'permission-denied':
        return this.matchPermissionDenied(method, path, this.activeMode);
      case 'intermittent-failure':
        return this.matchIntermittentFailure(method, path, this.activeMode);
    }
  }

  /**
   * Simulate a sample error for the currently active mode.
   * This produces the same GcsErrorSimulationResult that the interceptor would
   * return for a matching request, without mutating the request counter.
   *
   * Used by the GET /api/twin/gcs/error-mode endpoint so the frontend can
   * display the actual error response the backend will produce.
   */
  simulateSampleError(): GcsErrorSimulationResult | null {
    if (!this.activeMode) return null;

    switch (this.activeMode.type) {
      case 'bucket-not-found':
        // Representative: a GET to the configured bucket
        return gcsError(404, 'Not Found', 'notFound');
      case 'quota-exceeded':
        return gcsError(403, 'Quota exceeded', 'quotaExceeded');
      case 'permission-denied':
        return gcsError(403, 'Forbidden', 'forbidden');
      case 'intermittent-failure':
        return gcsError(500, 'Internal Server Error', 'internalError');
    }
  }

  /**
   * Reset all state: clear the active mode and reset the request counter.
   * Called by GcsTwin.reset() and GcsTwin.stop() to prevent leakage between tests.
   */
  reset(): void {
    this.activeMode = null;
    this.requestCounter = 0;
  }

  // ---------------------------------------------------------------------------
  // Private matching methods
  // ---------------------------------------------------------------------------

  private matchBucketNotFound(
    _method: string,
    path: string,
    config: BucketNotFoundConfig
  ): GcsErrorSimulationResult | null {
    const bucket = extractBucketName(path);
    if (bucket === config.bucketName) {
      return gcsError(404, 'Not Found', 'notFound');
    }
    return null;
  }

  private matchQuotaExceeded(
    method: string,
    path: string,
    _config: QuotaExceededConfig
  ): GcsErrorSimulationResult | null {
    if (isUploadOperation(method, path)) {
      return gcsError(403, 'Quota exceeded', 'quotaExceeded');
    }
    return null;
  }

  private matchPermissionDenied(
    method: string,
    path: string,
    _config: PermissionDeniedConfig
  ): GcsErrorSimulationResult | null {
    if (isGcsDataOperation(method, path)) {
      return gcsError(403, 'Forbidden', 'forbidden');
    }
    return null;
  }

  private matchIntermittentFailure(
    method: string,
    path: string,
    config: IntermittentFailureConfig
  ): GcsErrorSimulationResult | null {
    // Only apply to GCS data operations
    if (!isGcsDataOperation(method, path)) {
      return null;
    }

    this.requestCounter++;
    const every = config.every ?? 2;

    if (this.requestCounter % every === 0) {
      return gcsError(500, 'Internal Server Error', 'internalError');
    }
    return null;
  }
}
