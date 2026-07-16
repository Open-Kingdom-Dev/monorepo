/**
 * Runtime-configurable base URL for the backend RTK Query client.
 *
 * Mirrors the module-level auth-adapter pattern in `auth.slice.ts`: a mutable
 * module singleton with a setter, resolved lazily (per request) by `baseApi`'s
 * baseQuery instead of once at module load. This lets embedded hosts that
 * mount the backend at a dynamic path (e.g. `/api/app/{instance-id}`) call
 * `setApiBaseUrl(...)` at startup — or even switch it between requests —
 * without a build-time define.
 *
 * The value is the origin/mount path only, WITHOUT the `/api` suffix: the
 * generated endpoints already embed `/api/...` in every URL.
 */
let apiBaseUrl: string | undefined;

function envBaseUrl(): string {
  // The exact `process.env.VITE_API_BASE_URL` expression is what host bundlers
  // (Vite `define`, as in apps/demo-scaffold/vite.config.ts) replace at build
  // time — after replacement no `process` reference remains in the bundle.
  // Without a define, in a bare browser, the reference throws and we fall back
  // to '' (same-origin relative URLs) instead of crashing.
  try {
    return process.env.VITE_API_BASE_URL || '';
  } catch {
    return '';
  }
}

/**
 * Override the API base URL at runtime. Pass `undefined` to restore the
 * build-time default (`VITE_API_BASE_URL`, or '' for same-origin).
 */
export function setApiBaseUrl(url: string | undefined): void {
  apiBaseUrl = url || undefined;
}

/** The base URL requests will be issued against, resolved at call time. */
export function getApiBaseUrl(): string {
  return apiBaseUrl ?? envBaseUrl();
}
