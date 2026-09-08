import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  DEFAULT_REGISTRY_FILE_NAME,
  DEFAULT_SLOT_CACHE_ENV_VAR,
  leaseSlot,
} from './lease.js';
import { normalizeWorktreePath, parseRegistry } from './registry.js';

/**
 * These run against real `git worktree` checkouts in a temp dir — the lock,
 * the atomic write, and the common-dir rendezvous are the parts most worth
 * exercising for real rather than mocking.
 */
describe('leaseSlot', () => {
  let root: string;
  let primary: string;

  const run = (args: string[], cwd: string) =>
    execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();

  const addWorktree = (name: string, branch: string) => {
    const path = join(root, name);
    run(['worktree', 'add', '-b', branch, path], primary);
    return path;
  };

  const registryPath = () => join(primary, '.git', DEFAULT_REGISTRY_FILE_NAME);

  const lease = (cwd: string) => leaseSlot({ cwd, env: {} });

  beforeEach(() => {
    root = realpathSync(mkdtempSync(join(tmpdir(), 'port-lease-')));
    primary = join(root, 'project');
    execFileSync('git', ['init', '-b', 'main', primary], { stdio: 'ignore' });
    run(['config', 'user.email', 'test@example.com'], primary);
    run(['config', 'user.name', 'Test'], primary);
    writeFileSync(join(primary, 'README.md'), '# fixture\n');
    run(['add', '-A'], primary);
    run(['commit', '-m', 'init'], primary);
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('pins the primary worktree to slot 0 and records it', () => {
    const result = lease(primary);

    expect(result).toMatchObject({
      slot: 0,
      isPrimary: true,
      source: 'registry',
      branch: 'main',
    });
    expect(result.worktreePath).toBe(normalizeWorktreePath(primary));
    expect(result.registryPath).toBe(registryPath());
    expect(parseRegistry(readFileSync(registryPath(), 'utf8')).slots).toEqual({
      '0': { path: normalizeWorktreePath(primary), branch: 'main' },
    });
  });

  it('gives each added worktree its own slot, sharing one registry', () => {
    const a = addWorktree('wt-a', 'feature-a');
    const b = addWorktree('wt-b', 'feature-b');

    expect(lease(primary).slot).toBe(0);
    expect(lease(a).slot).toBe(1);
    expect(lease(b).slot).toBe(2);

    // One registry in the git common dir, reached identically from every worktree.
    expect(leaseSlot({ cwd: a, env: {} }).registryPath).toBe(registryPath());
    expect(
      Object.keys(parseRegistry(readFileSync(registryPath(), 'utf8')).slots)
    ).toEqual(['0', '1', '2']);
  });

  it('is stable across restarts', () => {
    const a = addWorktree('wt-a', 'feature-a');
    const first = lease(a).slot;
    expect(lease(a).slot).toBe(first);
    expect(lease(a).slot).toBe(first);
  });

  it('leases from a subdirectory of a worktree', () => {
    const a = addWorktree('wt-a', 'feature-a');
    const nested = join(a, 'src', 'deep');
    execFileSync('mkdir', ['-p', nested]);
    expect(lease(nested).slot).toBe(lease(a).slot);
  });

  it('prunes a removed worktree and reuses its slot', () => {
    const a = addWorktree('wt-a', 'feature-a');
    expect(lease(a).slot).toBe(1);

    run(['worktree', 'remove', '--force', a], primary);
    const b = addWorktree('wt-b', 'feature-b');

    expect(lease(b).slot).toBe(1);
    const slots = parseRegistry(readFileSync(registryPath(), 'utf8')).slots;
    expect(slots['1'].branch).toBe('feature-b');
  });

  it('caches the slot in the env var so children inherit it', () => {
    const a = addWorktree('wt-a', 'feature-a');
    const env: NodeJS.ProcessEnv = {};

    const parent = leaseSlot({ cwd: a, env });
    expect(env[DEFAULT_SLOT_CACHE_ENV_VAR]).toBe(String(parent.slot));

    // A child re-importing the config must not re-lease against another cwd.
    const child = leaseSlot({ cwd: primary, env });
    expect(child).toMatchObject({ slot: parent.slot, source: 'cache' });
  });

  it('ignores a non-numeric cache value rather than trusting it', () => {
    const env: NodeJS.ProcessEnv = { [DEFAULT_SLOT_CACHE_ENV_VAR]: 'nope' };
    expect(leaseSlot({ cwd: primary, env }).source).toBe('registry');
  });

  it('can opt out of the env cache entirely', () => {
    const env: NodeJS.ProcessEnv = {};
    leaseSlot({ cwd: primary, env, slotCacheEnvVar: false });
    expect(env[DEFAULT_SLOT_CACHE_ENV_VAR]).toBeUndefined();
  });

  it('degrades to slot 0 outside a git repo instead of throwing', () => {
    const outside = realpathSync(mkdtempSync(join(tmpdir(), 'not-git-')));
    const warnings: string[] = [];
    try {
      expect(
        leaseSlot({ cwd: outside, env: {}, onWarning: (m) => warnings.push(m) })
      ).toMatchObject({ slot: 0, source: 'degraded', registryPath: null });
      expect(warnings.join(' ')).toMatch(/degrading to slot 0/);
    } finally {
      rmSync(outside, { recursive: true, force: true });
    }
  });

  it('recovers from a corrupt registry by rebuilding it', () => {
    lease(primary);
    writeFileSync(registryPath(), '{ this is not json');

    expect(lease(primary).slot).toBe(0);
    expect(
      parseRegistry(readFileSync(registryPath(), 'utf8')).slots['0']
    ).toBeDefined();
  });

  it('steals a stale lock and warns, so a crashed process cannot wedge startup', () => {
    execFileSync('mkdir', ['-p', `${registryPath()}.lock`]);
    const warnings: string[] = [];

    const result = leaseSlot({
      cwd: primary,
      env: {},
      lockStaleMs: 20,
      lockRetryMs: 5,
      onWarning: (m) => warnings.push(m),
    });

    expect(result.slot).toBe(0);
    expect(warnings.join(' ')).toMatch(/stealing stale port lease lock/);
  });

  it('releases the lock and leaves no temp file behind', () => {
    lease(primary);
    expect(existsSync(`${registryPath()}.lock`)).toBe(false);
    expect(existsSync(`${registryPath()}.${process.pid}.tmp`)).toBe(false);
  });

  it('uses a custom registry file name when asked', () => {
    const custom = leaseSlot({
      cwd: primary,
      env: {},
      registryFileName: 'ports.json',
    });
    expect(custom.registryPath).toBe(join(primary, '.git', 'ports.json'));
    expect(existsSync(join(primary, '.git', 'ports.json'))).toBe(true);
  });
});
