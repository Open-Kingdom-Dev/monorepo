import {
  createListenerMiddleware,
  ThunkDispatch,
  UnknownAction,
} from '@reduxjs/toolkit';
import { addLog } from './logger.slice';
import type { LogEntry } from './logger.types';

export type LogPayload = Omit<LogEntry, 'id' | 'timestamp'>;

export type AppDispatch = ThunkDispatch<unknown, unknown, UnknownAction>;

export interface HttpLoggerConfig {
  /**
   * Callback for sending log entries to a remote API.
   *
   * @example Using fetch:
   * onSend: async (log) => {
   *   await fetch('/api/logs', { method: 'POST', body: JSON.stringify(log) });
   * }
   *
   * @example Using RTK Query:
   * onSend: (log, dispatch) => {
   *   dispatch(loggerApi.endpoints.sendLog.initiate(log));
   * }
   */
  onSend?: (
    logEntry: LogPayload,
    dispatch?: AppDispatch
  ) => void | Promise<void>;

  /**
   * Optional callback for handling send errors.
   * Consumer can wire this up to ErrorReporter or any other error handler.
   * If not provided, errors are silently ignored (to prevent infinite loops).
   */
  onError?: (error: unknown, logEntry: LogPayload) => void;
}

export const createHttpLoggerMiddleware = (config?: HttpLoggerConfig) => {
  const listenerMiddleware = createListenerMiddleware();

  listenerMiddleware.startListening({
    actionCreator: addLog,
    effect: async (action, listenerApi) => {
      const logEntry = action.payload;

      try {
        if (config?.onSend) {
          await config.onSend(logEntry, listenerApi.dispatch);
        }

        // If no onSend provided, skip HTTP sending (logs are still stored in Redux via the reducer)
      } catch (error) {
        config?.onError?.(error, logEntry);
      }
    },
  });

  return listenerMiddleware.middleware;
};
