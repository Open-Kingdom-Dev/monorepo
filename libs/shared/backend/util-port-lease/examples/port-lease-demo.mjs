#!/usr/bin/env node
/**
 * Manual demo of @open-kingdom/shared-backend-util-port-lease.
 *
 * Run it from whichever worktree you want to lease for — the lease follows the
 * current directory, not the script's location:
 *
 *   node <path-to-package>/examples/port-lease-demo.mjs
 *
 * It loads the built library next door (`../dist`), so it runs as-is from an
 * npm install, and in-repo after a build of the package.
 */
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const library = new URL('../dist/index.js', import.meta.url);
if (!existsSync(library)) {
  console.error(
    `\n  No build at ${fileURLToPath(library)} — build the package first.\n`
  );
  process.exit(1);
}
const {
  leaseSlot,
  portsForSlot,
  resolveUrlTemplates,
  findPortCollisions,
  findDuplicateBases,
  recommendWidth,
  findBusyPorts,
} = await import(library.href);

// An example stack's ports (the ok-monorepo demo app), as slot-0 bases.
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
