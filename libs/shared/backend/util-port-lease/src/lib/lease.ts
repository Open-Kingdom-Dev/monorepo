/**
 * The lease itself — §4 of docs/Worktree-Port-Leasing.md.
 *
 * A thin, synchronous git + filesystem wrapper around the pure functions in
 * `registry.ts`. Synchronous on purpose: test-runner configs load before their
 * workers spawn, so a lease that needed async I/O could not run there.
 */
import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';

import {
  parseRegistry,
  parseWorktreePorcelain,
  pruneRegistry,
  selectSlot,
  serializeRegistry,
} from './registry.js';

export const DEFAULT_REGISTRY_FILE_NAME = 'port-lease-registry.json';
export const DEFAULT_SLOT_CACHE_ENV_VAR = '__PORT_SLOT__';

export interface LeaseOptions {
  /** Directory to resolve the worktree from. Defaults to `process.cwd()`. */
  cwd?: string;
  /** Registry file name inside the git common dir. */
  registryFileName?: string;
  /**
   * Env var the slot is cached in, so child processes a test runner spawns
   * inherit the parent's slot instead of each re-leasing. Pass `false` to
   * disable both the read and the write.
   */
  slotCacheEnvVar?: string | false;
  /** Environment read for the cache and written back to. Defaults to `process.env`. */
  env?: NodeJS.ProcessEnv;
  /** Pause between lock attempts, in ms. */
  lockRetryMs?: number;
  /** After this long, a held lock is assumed crashed and is stolen. */
  lockStaleMs?: number;
  /** Receives non-fatal diagnostics (stale lock stolen, degraded to slot 0). */
  onWarning?: (message: string) => void;
}

export interface PortLease {
  slot: number;
  /** Normalized path of the leasing worktree; `null` when degraded. */
  worktreePath: string | null;
  branch: string | null;
  /** Absolute path of the registry file; `null` when degraded or cached. */
  registryPath: string | null;
  /** True when this is the clone's primary worktree (always slot 0). */
  isPrimary: boolean;
  /**
   * `registry` — leased normally.
   * `cache` — inherited from the slot-cache env var.
   * `degraded` — not a git worktree, or the registry was unusable; slot 0.
   */
  source: 'registry' | 'cache' | 'degraded';
}

/**
 * Leases this worktree's slot, creating or updating the shared registry in the
 * git common directory.
 *
 * Never throws: anything unexpected degrades to slot 0 — plain single-stack
 * behavior — so the mechanism can never block a dev server from starting.
 */
export function leaseSlot(options: LeaseOptions = {}): PortLease {
  const {
    cwd = process.cwd(),
    registryFileName = DEFAULT_REGISTRY_FILE_NAME,
    slotCacheEnvVar = DEFAULT_SLOT_CACHE_ENV_VAR,
    env = process.env,
    lockRetryMs = 25,
    lockStaleMs = 5000,
    onWarning = () => undefined,
  } = options;

  const cached = readCachedSlot(env, slotCacheEnvVar);
  if (cached !== null) {
    return {
      slot: cached,
      worktreePath: null,
      branch: null,
      registryPath: null,
      isPrimary: cached === 0,
      source: 'cache',
    };
  }

  const facts = gatherGitFacts(cwd);
  if (!facts) {
    onWarning(`not a git worktree (${cwd}); degrading to slot 0`);
    return degraded(env, slotCacheEnvVar);
  }

  const registryPath = join(facts.commonDir, registryFileName);
  const lockDir = `${registryPath}.lock`;

  try {
    const result = withLock(
      lockDir,
      { retryMs: lockRetryMs, staleMs: lockStaleMs, onWarning },
      () => {
        const pruned = pruneRegistry(
          parseRegistry(readFileIfExists(registryPath)),
          facts.livePaths
        );
        const selected = selectSlot(pruned, {
          worktreePath: facts.worktreePath,
          primaryWorktreePath: facts.primaryWorktreePath,
          branch: facts.branch,
        });
        writeAtomic(registryPath, serializeRegistry(selected.registry));
        return selected;
      }
    );

    cacheSlot(env, slotCacheEnvVar, result.slot);
    return {
      slot: result.slot,
      worktreePath: facts.worktreePath,
      branch: facts.branch,
      registryPath,
      isPrimary: result.isPrimary,
      source: 'registry',
    };
  } catch (error) {
    onWarning(`port lease failed (${describe(error)}); degrading to slot 0`);
    return degraded(env, slotCacheEnvVar);
  }
}

interface GitFacts {
  commonDir: string;
  worktreePath: string;
  primaryWorktreePath: string;
  branch: string;
  livePaths: string[];
}

function gatherGitFacts(cwd: string): GitFacts | null {
  const commonDirRaw = git(['rev-parse', '--git-common-dir'], cwd);
  const worktreePath = git(['rev-parse', '--show-toplevel'], cwd);
  const worktreeList = git(['worktree', 'list', '--porcelain'], cwd);
  if (!commonDirRaw || !worktreePath || !worktreeList) return null;

  const livePaths = parseWorktreePorcelain(worktreeList);
  if (livePaths.length === 0) return null;

  return {
    // `--git-common-dir` answers relatively (`.git`) from the primary worktree.
    commonDir: isAbsolute(commonDirRaw)
      ? commonDirRaw
      : resolve(cwd, commonDirRaw),
    worktreePath,
    // git always lists the primary worktree first.
    primaryWorktreePath: livePaths[0],
    branch: git(['rev-parse', '--abbrev-ref', 'HEAD'], cwd) ?? '',
    livePaths,
  };
}

function git(args: string[], cwd: string): string | null {
  try {
    return execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
}

interface LockOptions {
  retryMs: number;
  staleMs: number;
  onWarning: (message: string) => void;
}

/**
 * An atomic `mkdir` is a portable, dependency-free mutex — it either succeeds
 * or fails with EEXIST. A held lock older than `staleMs` is stolen, so a
 * crashed process can never permanently wedge startup.
 */
function withLock<T>(lockDir: string, options: LockOptions, fn: () => T): T {
  const { retryMs, staleMs, onWarning } = options;
  const maxSteals = 3;
  let steals = 0;
  let deadline = Date.now() + staleMs;

  for (;;) {
    try {
      mkdirSync(lockDir, { recursive: false });
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
      if (Date.now() >= deadline) {
        steals += 1;
        if (steals > maxSteals) {
          throw new Error(`could not acquire port lease lock at ${lockDir}`);
        }
        onWarning(`stealing stale port lease lock at ${lockDir}`);
        rmSync(lockDir, { recursive: true, force: true });
        deadline = Date.now() + staleMs;
        continue;
      }
      sleepSync(retryMs);
    }
  }

  try {
    return fn();
  } finally {
    rmSync(lockDir, { recursive: true, force: true });
  }
}

/** Temp file + rename, so a crash mid-write cannot corrupt the registry. */
function writeAtomic(path: string, contents: string): void {
  const tmp = `${path}.${process.pid}.tmp`;
  try {
    writeFileSync(tmp, contents, 'utf8');
    renameSync(tmp, path);
  } catch (error) {
    rmSync(tmp, { force: true });
    throw error;
  }
}

function readFileIfExists(path: string): string | null {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return null;
  }
}

function readCachedSlot(
  env: NodeJS.ProcessEnv,
  varName: string | false
): number | null {
  if (varName === false) return null;
  const raw = env[varName];
  if (raw === undefined || raw === '') return null;
  const slot = Number(raw);
  return Number.isInteger(slot) && slot >= 0 ? slot : null;
}

function cacheSlot(
  env: NodeJS.ProcessEnv,
  varName: string | false,
  slot: number
): void {
  if (varName === false) return;
  env[varName] = String(slot);
}

function degraded(env: NodeJS.ProcessEnv, varName: string | false): PortLease {
  cacheSlot(env, varName, 0);
  return {
    slot: 0,
    worktreePath: null,
    branch: null,
    registryPath: null,
    isPrimary: true,
    source: 'degraded',
  };
}

function sleepSync(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
