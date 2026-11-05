import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';
import type * as PortLease from '@open-kingdom/shared-backend-util-port-lease';

// For CI, you may want to set BASE_URL to the deployed application.
// Note: Config files are evaluated at build time, so process.env is used directly here.
const baseURL = process.env['BASE_URL'] || 'http://localhost:4300';

// The port-lease specs need the real backend. Its port is leased per worktree,
// so e2e runs in two worktrees never share — or reuse — each other's backend.
// The base sits clear of every port the demo stack itself leases. Leasing also
// caches the slot in the env, so test workers inherit it.
function leaseBackendPort(): number {
  try {
    // Required lazily: Nx evaluates this config to build its project graph,
    // before the e2e target's dependsOn has built the package.
    const lib: typeof PortLease = require('@open-kingdom/shared-backend-util-port-lease');
    const { slot } = lib.leaseSlot({ onWarning: (m) => console.warn(m) });
    return lib.portForSlot(3900, slot, { width: 10 });
  } catch (error) {
    // Graph computation must survive this; the port-lease spec fails on it.
    process.env['PORT_LEASE_E2E_ERROR'] = (error as Error).message;
    console.warn(
      `port lease unavailable (${(error as Error).message}); e2e backend ` +
        'falls back to port 3900 — build shared-backend-util-port-lease first'
    );
    return 3900;
  }
}
const backendPort = leaseBackendPort();
const backendURL = `http://localhost:${backendPort}`;
process.env['PORT_LEASE_E2E_BACKEND_URL'] = backendURL;

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  ...nxE2EPreset(__filename, { testDir: './src' }),
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },
  /* Run your local dev server before starting the tests */
  webServer: [
    {
      command: 'npx nx run @open-kingdom/demo-scaffold:preview',
      url: 'http://localhost:4300',
      reuseExistingServer: true,
      cwd: workspaceRoot,
    },
    {
      // A fresh checkout (CI) has no demo.db and the backend won't boot on an
      // empty one; an existing database is left alone.
      command:
        `node -e "fs.existsSync('demo.db') || child_process.execSync('npm run db:migrate', { stdio: 'inherit' })"` +
        ' && npx nx serve @open-kingdom/demo-scaffold-backend',
      url: `${backendURL}/api/port-lease/status`,
      // Safe to reuse: the lease guarantees this port belongs to this worktree.
      reuseExistingServer: true,
      cwd: workspaceRoot,
      env: { PORT: String(backendPort) },
      timeout: 180_000,
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  reporter: 'list',
});
