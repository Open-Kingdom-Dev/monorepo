import { ChildProcess, execFileSync, spawn } from 'node:child_process';
import { copyFileSync, mkdtempSync, realpathSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test, expect, APIRequestContext, Page } from '@playwright/test';
// The config requires this package lazily only to survive Nx's graph pass;
// code splitting is moot in Node-run tests.
// eslint-disable-next-line @nx/enforce-module-boundaries
import {
  leaseSlot,
  normalizeWorktreePath,
  portForSlot,
} from '@open-kingdom/shared-backend-util-port-lease';

import { PortLeaseDemoPage } from './pages/PortLeaseDemoPage';

// Set by playwright.config.ts, which starts the backend on a leased port.
const backendURL = process.env['PORT_LEASE_E2E_BACKEND_URL'] ?? '';

interface PortLeaseStatus {
  slot: number;
  source: string;
  isPrimary: boolean;
  worktreePath: string | null;
  width: number;
  backendPort: number;
  ports: { name: string; base: number; leased: number; busy: boolean }[];
  registry: { slot: number; path: string; current: boolean }[];
}

function git(args: string[], cwd?: string): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

async function getStatus(request: APIRequestContext): Promise<PortLeaseStatus> {
  const response = await request.get(`${backendURL}/api/port-lease/status`);
  expect(response.ok()).toBe(true);
  return response.json();
}

/**
 * A real git worktree of this repo, leased the way a dev server in it would
 * lease. `--no-checkout` keeps it instant: git lists it like any other.
 */
function addLeasedWorktree() {
  const parent = realpathSync.native(
    mkdtempSync(join(tmpdir(), 'port-lease-e2e-'))
  );
  const path = join(parent, 'wt');
  git(['worktree', 'add', '--no-checkout', '--detach', path, 'HEAD']);
  const lease = leaseSlot({ cwd: path, slotCacheEnvVar: false });
  return {
    path: normalizeWorktreePath(path),
    slot: lease.slot,
    remove() {
      git(['worktree', 'remove', '--force', path]);
      rmSync(parent, { recursive: true, force: true });
    },
  };
}

// The preview server has no /api proxy, so send the page's API calls to the
// real backend.
async function routeApiToBackend(page: Page) {
  await page.route('**/api/**', async (route) => {
    const { pathname, search } = new URL(route.request().url());
    const response = await route.fetch({
      url: `${backendURL}${pathname}${search}`,
    });
    await route.fulfill({ response });
  });
}

async function stop(child: ChildProcess) {
  if (child.exitCode !== null) return;
  const exited = new Promise((resolve) => child.once('exit', resolve));
  child.kill();
  await exited;
}

test.describe.serial('the port lease API', () => {
  test('leases the slot of the checkout the backend runs in', async ({
    request,
  }) => {
    const toplevel = normalizeWorktreePath(
      git(['rev-parse', '--show-toplevel'])
    );
    const primary = normalizeWorktreePath(
      git(['worktree', 'list', '--porcelain']).split('\n')[0].slice(9)
    );

    const status = await getStatus(request);

    expect(status.source).toBe('registry');
    expect(normalizeWorktreePath(status.worktreePath ?? '')).toBe(toplevel);
    expect(status.isPrimary).toBe(toplevel === primary);
    // Slot 0 is reserved for, and always held by, the primary worktree.
    expect(status.slot === 0).toBe(status.isPrimary);
    expect(status.registry).toContainEqual(
      expect.objectContaining({ slot: status.slot, current: true })
    );
    // Stable across requests: a restart keeps its ports.
    expect((await getStatus(request)).slot).toBe(status.slot);
  });

  test('runs the e2e backend on the port leased for this checkout', async ({
    request,
  }) => {
    expect(
      process.env['PORT_LEASE_E2E_ERROR'],
      'playwright.config.ts fell back to a fixed port'
    ).toBeUndefined();

    const status = await getStatus(request);
    // Same base and width as playwright.config.ts; the slot comes from the backend.
    expect(status.backendPort).toBe(
      portForSlot(3900, status.slot, { width: 10 })
    );
  });

  test('derives every port as base + slot × width', async ({ request }) => {
    const status = await getStatus(request);

    for (const port of status.ports) {
      expect(port.leased).toBe(port.base + status.slot * status.width);
    }
    const leased = status.ports.map((p) => p.leased);
    expect(new Set(leased).size).toBe(leased.length);
  });

  test('gives a new worktree its own slot and frees it once removed', async ({
    request,
  }) => {
    const before = await getStatus(request);
    const worktree = addLeasedWorktree();
    try {
      expect(worktree.slot).not.toBe(before.slot);
      expect(worktree.slot).toBeGreaterThan(0);

      const during = await getStatus(request);
      expect(during.slot).toBe(before.slot);
      expect(during.registry).toContainEqual(
        expect.objectContaining({
          slot: worktree.slot,
          path: worktree.path,
          current: false,
        })
      );
    } finally {
      worktree.remove();
    }

    // The next lease prunes the deleted worktree — no delete hook needed.
    const after = await getStatus(request);
    expect(after.registry.map((r) => r.path)).not.toContain(worktree.path);
  });

  test('offsets every port for a backend running in another worktree', async ({
    request,
  }) => {
    test.setTimeout(60_000);
    const worktree = addLeasedWorktree();
    // The built backend (from `nx serve` above) with the worktree as cwd, so
    // it leases that worktree's slot. demo.db is opened from the cwd.
    const toplevel = git(['rev-parse', '--show-toplevel']);
    copyFileSync(join(toplevel, 'demo.db'), join(worktree.path, 'demo.db'));
    const port = portForSlot(3900, worktree.slot, { width: 10 });
    const backend = spawn(
      process.execPath,
      [join(toplevel, 'apps/demo-scaffold-backend/dist/main.js')],
      { cwd: worktree.path, env: { ...process.env, PORT: String(port) } }
    );
    let output = '';
    backend.stdout.on('data', (chunk) => (output += chunk));
    backend.stderr.on('data', (chunk) => (output += chunk));
    const url = `http://localhost:${port}/api/port-lease/status`;
    try {
      await expect
        .poll(
          async () =>
            backend.exitCode === null &&
            ((await request.get(url).catch(() => null))?.ok() ?? false),
          {
            message: `worktree backend never answered:\n${output}`,
            timeout: 30_000,
          }
        )
        .toBe(true);
      const status: PortLeaseStatus = await (await request.get(url)).json();

      expect(status.slot).toBe(worktree.slot);
      expect(status.isPrimary).toBe(false);
      expect(normalizeWorktreePath(status.worktreePath ?? '')).toBe(
        worktree.path
      );
      expect(status.registry).toContainEqual(
        expect.objectContaining({ slot: worktree.slot, current: true })
      );
      for (const leased of status.ports) {
        expect(leased.leased).toBe(leased.base + worktree.slot * status.width);
        expect(leased.leased).not.toBe(leased.base);
      }
    } finally {
      await stop(backend);
      worktree.remove();
    }
  });

  test('flags a leased port as busy while something listens on it', async ({
    request,
  }) => {
    const status = await getStatus(request);
    const target = status.ports.find((p) => !p.busy);
    expect(target, 'needs one leased port free on this machine').toBeDefined();
    const { name, leased } = target as PortLeaseStatus['ports'][number];

    // Default listen() binds `::`, the case a 127.0.0.1-only check misses.
    const server = createServer();
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(leased, resolve);
    });
    try {
      const busy = await getStatus(request);
      expect(busy.ports.find((p) => p.name === name)?.busy).toBe(true);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }

    const free = await getStatus(request);
    expect(free.ports.find((p) => p.name === name)?.busy).toBe(false);
  });
});

test.describe.serial('the port lease demo page', () => {
  let demo: PortLeaseDemoPage;

  test.beforeEach(async ({ page }) => {
    demo = new PortLeaseDemoPage(page);
  });

  test('shows the live lease for this checkout', async ({ page, request }) => {
    await routeApiToBackend(page);
    const status = await getStatus(request);
    await demo.goto();

    await expect(demo.getStat('slot')).toHaveText(String(status.slot));
    await expect(demo.getStat('width')).toHaveText(String(status.width));
    await expect(demo.getStat('primary')).toHaveText(
      status.isPrimary ? 'yes' : 'no'
    );
    for (const port of status.ports) {
      await expect(demo.getLeasedPort(port.name)).toHaveText(
        String(port.leased)
      );
    }
    await expect(demo.getRegistryEntry(status.slot)).toContainText('← this');
    // The e2e backend runs on its own leased port, never the demo's PORT.
    await expect(demo.getMismatchNote()).toContainText(
      `listening on ${status.backendPort}`
    );
  });

  test('picks up a worktree added after the page loaded', async ({ page }) => {
    await routeApiToBackend(page);
    await demo.goto();
    await expect(demo.getStat('slot')).toBeVisible();

    const worktree = addLeasedWorktree();
    try {
      await expect(demo.getRegistryEntry(worktree.slot)).toHaveCount(0);
      await demo.refresh();
      await expect(demo.getRegistryEntry(worktree.slot)).toContainText(
        worktree.path
      );
    } finally {
      worktree.remove();
    }
  });

  test('offers a retry when the API is down, then recovers', async ({
    page,
  }) => {
    await page.route('**/api/**', (route) => route.abort());
    await demo.goto();
    await expect(demo.getError()).toBeVisible();

    await page.unrouteAll();
    await routeApiToBackend(page);
    await demo.retry();
    await expect(demo.getStat('slot')).toBeVisible();
  });
});
