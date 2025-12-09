import { useCallback, useMemo } from 'react';
import type { HandleErrorOptions } from '../error-autologger.types';
import { ErrorReporter, type ErrorReporterConfig } from '../error-autologger';

// React hook for error reporting - provides a function to report errors with optional logging and notification.
// The returned function can be called with any error and optional metadata to report it.
// It uses the ErrorReporter class internally to handle the actual reporting logic.
export function useErrorReporter(options: ErrorReporterConfig = {}) {
  const { logger, notificationHandler, adapter } = options;

  const reporter = useMemo(
    () => new ErrorReporter({ logger, notificationHandler, adapter }),
    [logger, notificationHandler, adapter]
  );

  return useCallback(
    (error: unknown, opts: HandleErrorOptions = {}) =>
      reporter.report(error, opts),
    [reporter]
  );
}
