#!/usr/bin/env node
/**
 * Manual demo of @open-kingdom/shared-backend-util-port-lease.
 *
 * Companion to docs/Worktree-Port-Leasing-Manual-Test.md. Run from any worktree
 * of this repo:
 *
 *   node <main-checkout>/docs/port-lease-demo.mjs
 *
 * Resolves the built library through the git common dir, so it also works from
 * worktrees that have no node_modules of their own. Requires a prior
 * `npx nx build @open-kingdom/shared-backend-util-port-lease`.
 *
 * Intentionally not committed — see the doc's closing note.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// This script lives outside the repo, so resolve the built library through the
// git common dir — the same rendezvous point the registry uses.
// Falls back to OK_ROOT so the degradation step (run from outside any repo,
// where this lookup necessarily fails) can still load the library.
function findMainCheckout() {
  try {
    const commonDir = execFileSync('git', ['rev-parse', '--git-common-dir'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return dirname(
      isAbsolute(commonDir) ? commonDir : resolve(process.cwd(), commonDir)
    );
  } catch {
    if (process.env.OK_ROOT) return resolve(process.env.OK_ROOT);
    console.error(
      '\n  Not inside a git repo, and OK_ROOT is unset — cannot locate the built\n' +
        '  library. Re-run as:  OK_ROOT=/path/to/ok-monorepo node <this script>\n'
    );
    process.exit(1);
  }
}
const mainCheckout = findMainCheckout();
const {
  leaseSlot,
  portsForSlot,
  resolveUrlTemplates,
  findPortCollisions,
  findDuplicateBases,
  recommendWidth,
  findBusyPorts,
} = await import(
  pathToFileURL(
    join(mainCheckout, 'libs/shared/backend/util-port-lease/dist/index.js')
  ).href
);

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
