/**
 * Activation gate for integration‑test‑doubles.
 * Twins should only start when the test‑mode environment variable is set.
 */

/**
 * Returns `true` if the library is running in test mode.
 *
 * Test mode is enabled when the environment variable `TEST_MODE` is exactly the string `'true'`.
 * This check is case‑sensitive.
 *
 * @example
 * ```ts
 * if (isTestMode()) {
 *   await twin.start();
 * }
 * ```
 */
export function isTestMode(): boolean {
  return process.env.TEST_MODE === 'true';
}
