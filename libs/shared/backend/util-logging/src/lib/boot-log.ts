import { existsSync, renameSync, statSync } from 'fs';

import { pino } from 'pino';

import { LineOptions, lineOptions } from './pino-options';

import type { Logger } from 'pino';

export interface BootLogOptions extends LineOptions {
  /**
   * File for boot lines. Omitted, they go to stdout. Kept apart from rotating log files, whose
   * transport can't be written to synchronously.
   */
  file?: string;
  /** Size past which the file is moved aside (to `<file>.1`) at startup. Defaults to 1 MB. */
  maxBytes?: number;
}

/** Moves an oversized boot file aside, so startup never appends to an unbounded file. */
function trimAtStartup(file: string, maxBytes: number): void {
  try {
    if (existsSync(file) && statSync(file).size > maxBytes) {
      renameSync(file, `${file}.1`);
    }
  } catch {
    /* logging must never stop a boot */
  }
}

/**
 * A logger for boot lines: usable before Nest exists, and writing synchronously in the same
 * JSON shape as runtime lines, so a crash during startup still leaves its last line.
 */
export function createBootLogger(options: BootLogOptions): Logger {
  if (options.file) trimAtStartup(options.file, options.maxBytes ?? 1024 * 1024);
  return pino(
    lineOptions(options),
    pino.destination({ dest: options.file ?? 1, sync: true, mkdir: true })
  );
}

/**
 * Writes a fatal boot line for an uncaught exception or unhandled rejection before the process
 * exits. Uses Node's monitor event, so exit behavior is unchanged.
 */
export function installCrashLogging(bootLogger: Logger): void {
  process.on('uncaughtExceptionMonitor', (error, origin) => {
    bootLogger.fatal({ err: error, origin }, `Fatal ${origin}`);
  });
}
