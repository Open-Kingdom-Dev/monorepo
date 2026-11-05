import { currentScopeFields } from './request-context';
import {
  ErrorSummaryHook,
  moveErrorArguments,
  serializeError,
} from './safe-error';

import type {
  LevelWithSilent,
  LoggerOptions,
  TransportSingleOptions,
} from 'pino';

/** What every log line, at runtime or during boot, is built from. */
export interface LineOptions {
  /** Name of the host app, written as `app` on every line. */
  app: string;
  /** Product family, written as `project` on every line. */
  project: string;
  /** Deployment stage, written as `env` on every line. */
  env: string;
  /** Paths to strip from every line. Required: a host with nothing to redact passes `[]`. */
  redact: string[];
  /** Default level; the `LOG_LEVEL` environment variable overrides it. Defaults to `info`. */
  level?: LevelWithSilent;
  /** Adds one safe line about an error to its logged description; must never return values. */
  summarizeError?: ErrorSummaryHook;
}

/** A size-capped set of rotating JSON log files, as on a device with no log shipping of its own. */
export interface LogFileOptions {
  /** Path of the active file, e.g. `C:\ProgramData\WonderWall\logs\ww-backend.log`. */
  path: string;
  /** Size at which the file rotates. Defaults to 5 MB. */
  maxBytes?: number;
  /** Files kept, the active one included. Defaults to 5. */
  maxFiles?: number;
}

const LEVELS: readonly string[] = [
  'fatal',
  'error',
  'warn',
  'info',
  'debug',
  'trace',
  'silent',
];

/** `LOG_LEVEL`, when it names a level, lets one deployment debug without a code change. */
function levelFor(configured: LevelWithSilent | undefined): LevelWithSilent {
  const override = process.env['LOG_LEVEL']?.toLowerCase();
  if (override && LEVELS.includes(override)) {
    return override as LevelWithSilent;
  }
  return configured ?? 'info';
}

export function lineOptions(options: LineOptions): LoggerOptions {
  return {
    level: levelFor(options.level),
    base: { app: options.app, project: options.project, env: options.env },
    formatters: { level: (label) => ({ level: label }) },
    redact: { paths: options.redact, remove: true },
    mixin: () => currentScopeFields(),
    serializers: {
      // pino-http hands custom serializers pino's own serialized error, with the original
      // kept under `raw`.
      err: (error: { raw?: unknown }) =>
        serializeError(error?.raw ?? error, options.summarizeError),
    },
    hooks: {
      logMethod(args, method) {
        method.apply(
          this,
          moveErrorArguments(args, options.summarizeError) as Parameters<
            typeof method
          >
        );
      },
    },
  };
}

/**
 * The one transport lines go through: rotating files when the host asks for them, else
 * stdout, human-readable when `pretty`. Only one, because pino refuses custom level labels
 * with several targets. Targets resolve from this package, which depends on them, so a host
 * that never imports them still gets them installed.
 */
export function transportFor(
  file: LogFileOptions | undefined,
  pretty: boolean
): TransportSingleOptions {
  if (file) {
    const maxBytes = file.maxBytes ?? 5 * 1024 * 1024;
    const maxFiles = file.maxFiles ?? 5;
    return {
      target: require.resolve('pino-roll'),
      options: {
        file: file.path,
        size: `${Math.ceil(maxBytes / 1024)}k`,
        limit: { count: maxFiles - 1 },
        mkdir: true,
      },
    };
  }
  if (pretty) {
    return {
      target: require.resolve('pino-pretty'),
      options: { destination: 1 },
    };
  }
  return { target: 'pino/file', options: { destination: 1 } };
}
