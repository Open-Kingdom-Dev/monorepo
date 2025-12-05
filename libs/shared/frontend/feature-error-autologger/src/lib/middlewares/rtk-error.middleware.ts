import type { Middleware } from '@reduxjs/toolkit';
import type {
  RTKErrorMiddlewareConfig,
  ReduxRTKErrorMiddlewareConfig,
} from '../error-autologger.types';
import { ErrorReporter } from '../error-autologger';

interface RejectedAction {
  type: string;
  payload?: unknown;
  error?: unknown;
  meta?: {
    arg?: { endpointName?: string };
    rejectedWithValue?: boolean;
  };
}

const DEFAULT_MESSAGE = 'An error occurred while processing your request';

function isRejectedAction(action: unknown): action is RejectedAction {
  if (typeof action !== 'object' || action === null) {
    return false;
  }

  const act = action as RejectedAction;

  return (
    typeof act.type === 'string' &&
    (act.type.endsWith('/rejected') || act.meta?.rejectedWithValue === true)
  );
}

function getErrorContext(action: RejectedAction) {
  return {
    type: 'rtk-query',
    endpoint: action.meta?.arg?.endpointName || 'unknown',
  };
}

function getErrorSource(action: RejectedAction) {
  return action.payload || action.error;
}

// Middleware using callback functions (for non-Redux contexts)
export function createRTKErrorMiddleware(
  config: RTKErrorMiddlewareConfig = {}
): Middleware {
  const {
    logger,
    notificationHandler,
    notify = true,
    log = true,
    defaultMessage = DEFAULT_MESSAGE,
    shouldHandle,
  } = config;

  const reporter = new ErrorReporter({ logger, notificationHandler });

  return () => (next) => (action) => {
    if (isRejectedAction(action)) {
      if (shouldHandle && !shouldHandle(action)) {
        return next(action);
      }

      reporter.report(getErrorSource(action), {
        notify,
        log,
        userMessage: defaultMessage,
        context: getErrorContext(action),
      });
    }

    return next(action);
  };
}

// Middleware using Redux action creators (for Redux stores)
export function createReduxRTKErrorMiddleware(
  config: ReduxRTKErrorMiddlewareConfig
): Middleware {
  const {
    logAction,
    notifyAction,
    notify = true,
    log = true,
    defaultMessage = DEFAULT_MESSAGE,
    shouldHandle,
  } = config;

  return ({ dispatch }) => {
    const reporter = new ErrorReporter({
      logger: (message) => dispatch(logAction({ message, level: 'error' })),
      notificationHandler: (message) => dispatch(notifyAction(message)),
    });

    return (next) => (action) => {
      if (isRejectedAction(action)) {
        if (shouldHandle && !shouldHandle(action)) {
          return next(action);
        }

        reporter.report(getErrorSource(action), {
          notify,
          log,
          userMessage: defaultMessage,
          context: getErrorContext(action),
        });
      }

      return next(action);
    };
  };
}
