#!/usr/bin/env node
/**
 * Manual demo of @open-kingdom/shared-backend-util-port-lease.
 *
 * Companion to docs/Worktree-Port-Leasing-Manual-Test.md. Run from any worktree
 * of this repo:
 *
 *   node <main-checkout>/libs/shared/backend/util-port-lease/examples/port-lease-demo.mjs
 *
 * Installed from npm, it runs as-is: the built library sits next door.
 *
 * In-repo it needs a prior `npx nx build @open-kingdom/shared-backend-util-port-lease`,
 * and from a worktree with no node_modules of its own it falls back to
 * resolving that build through the git common dir.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const LIB_SUBPATH = 'libs/shared/backend/util-port-lease/dist/index.js';

/**
 * Finds the built library, in the order that puts the cheapest answer first:
 *
 *  1. The sibling `../dist` — true when installed from npm, and in the main
 *     checkout after a build.
 *  2. Through the git common dir — the same rendezvous point the registry
 *     uses. This is the case that matters for the manual test: a freshly-added
 *     worktree has the source but no build and no node_modules of its own, and
 *     the common dir leads back to the main checkout that does.
 *  3. `OK_ROOT`, for the degradation step — run from outside any repo, where
 *     the git lookup necessarily fails.
 */
function findLibrary() {
  const sibling = resolve(
    dirname(fileURLToPath(import.meta.url)),
    '../dist/index.js'
  );
  if (existsSync(sibling)) return sibling;

  try {
    const commonDir = execFileSync('git', ['rev-parse', '--git-common-dir'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    const mainCheckout = dirname(
      isAbsolute(commonDir) ? commonDir : resolve(process.cwd(), commonDir)
    );
    const built = join(mainCheckout, LIB_SUBPATH);
    if (existsSync(built)) return built;
    console.error(
      `\n  Found the main checkout (${mainCheckout}) but no build. Run:\n` +
        '    npx nx build @open-kingdom/shared-backend-util-port-lease\n'
    );
    process.exit(1);
  } catch {
    if (process.env.OK_ROOT)
      return join(resolve(process.env.OK_ROOT), LIB_SUBPATH);
    console.error(
      '\n  Not inside a git repo, and OK_ROOT is unset — cannot locate the built\n' +
        '  library. Re-run as:  OK_ROOT=/path/to/ok-monorepo node <this script>\n'
    );
    process.exit(1);
  }
}
const {
  leaseSlot,
  portsForSlot,
  resolveUrlTemplates,
  findPortCollisions,
  findDuplicateBases,
  recommendWidth,
  findBusyPorts,
} = await import(pathToFileURL(findLibrary()).href);

// This repo's real ports, as slot-0 bases.
const PORT_MAP = {
  PORT: 3000, // demo-scaffold-backend
  FRONTEND_PORT: 4200, // vite dev
  PREVIEW_PORT: 4300, // vite preview / e2e baseURL
  GCS_TWIN_PORT: 9013,
  GMAIL_TWIN_PORT: 9014,
  GOOGLE_AUTH_TWIN_PORT: 9015,
  YOUTUBE_TWIN_PORT: 9016,
  GOOGLE_CALENDAR_TWIN_PORT: 9017,
  SPOTIFY_TWIN_PORT: 9018,
};

const MAX_SLOTS = 8;

// A width must clear one stack's needs AND survive the cross-slot check: an
// "obvious" round number can still collide. 100 looks fine but isn't, because
// FRONTEND(4200) + 1x100 lands exactly on PREVIEW(4300).
const NAIVE_WIDTH = 100;
const naive = findPortCollisions(PORT_MAP, { width: NAIVE_WIDTH }, MAX_SLOTS);
console.log(
  `\n  width ${NAIVE_WIDTH}: ${naive.length} cross-slot collision(s)`
);
for (const c of naive.slice(0, 3)) {
  const [a, b] = c.between;
  console.log(
    `    port ${c.port} — ${a.name}@slot${a.slot} vs ${b.name}@slot${b.slot}`
  );
}

// Names sharing a base collide inside every slot and no shift can separate
// them — reported separately, because it is often deliberate.
const shared = findDuplicateBases(PORT_MAP);
console.log(
  shared.length
    ? `  shared bases: ${shared
        .map((d) => `${d.base} (${d.names.join(', ')})`)
        .join('; ')}`
    : '  shared bases: none'
);

// minWidth 50 leaves headroom for new services; the default floor would be the
// number of distinct bases (9 here), which is collision-free but has none.
const width = recommendWidth(PORT_MAP, { maxSlots: MAX_SLOTS, minWidth: 50 });
const BAND = { width };

const lease = leaseSlot({ onWarning: (m) => console.warn(`  ⚠ ${m}`) });
const ports = portsForSlot(PORT_MAP, lease.slot, BAND);
const urls = resolveUrlTemplates(
  {
    VITE_API_BASE_URL: 'http://localhost:{PORT}',
    E2E_BASE_URL: 'http://localhost:{PREVIEW_PORT}',
    YOUTUBE_TWIN_URL: 'http://127.0.0.1:{YOUTUBE_TWIN_PORT}',
  },
  ports
);

console.log(`\n  worktree : ${lease.worktreePath ?? '(degraded)'}`);
console.log(`  branch   : ${lease.branch ?? '-'}`);
console.log(
  `  SLOT     : ${lease.slot}   (${lease.source}${
    lease.isPrimary ? ', primary' : ''
  })`
);
console.log(
  `  width    : ${width}  — collision-free for slots 0-${MAX_SLOTS - 1}\n`
);

console.log('  ports:');
for (const [name, port] of Object.entries(ports)) {
  const shift = port - PORT_MAP[name];
  console.log(
    `    ${name.padEnd(26)} ${String(port).padStart(5)}${
      shift ? `   (+${shift})` : '   (base)'
    }`
  );
}

console.log('\n  derived URLs:');
for (const [name, url] of Object.entries(urls)) {
  console.log(`    ${name.padEnd(26)} ${url}`);
}

const busy = await findBusyPorts(Object.values(ports));
console.log(
  busy.length
    ? `\n  ⚠ already bound (stale/foreign process — NOT reassigned): ${busy.join(
        ', '
      )}`
    : '\n  bind-check: all clear'
);

if (lease.registryPath) {
  console.log(`\n  registry (${lease.registryPath}):`);
  console.log(
    readFileSync(lease.registryPath, 'utf8')
      .trimEnd()
      .split('\n')
      .map((l) => `    ${l}`)
      .join('\n')
  );
}
console.log();
