import { createListenerMiddleware } from '@reduxjs/toolkit';
import { addLog } from './logger.slice';

export const createConsoleLoggerMiddleware = () => {
  const loggerListenerMiddleware = createListenerMiddleware();
  // Listen for when logs are added
  loggerListenerMiddleware.startListening({
    actionCreator: addLog,
    effect: (action, _listenerApi) => {
      const logEntry = action.payload;
      const { message, level } = logEntry;

      // Log to console based on level
      switch (level) {
        case 'info':
          console.info(`[INFO] ${message}`);
          break;
        case 'warn':
          console.warn(`[WARN] ${message}`);
          break;
        case 'error':
          console.error(`[ERROR] ${message}`);
          break;
      }
    },
  });
  return loggerListenerMiddleware.middleware;
};
