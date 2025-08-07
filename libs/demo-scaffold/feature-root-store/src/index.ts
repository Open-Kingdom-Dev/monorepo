import { configureStore } from '@reduxjs/toolkit';
import {
  LoggerConfig,
  LoggerKey,
  createLoggerMiddleware,
  loggerReducer,
} from '@ynaa/shared-data-access-logger';
import {
  NotificationKey,
  notificationReducer,
} from '@ynaa/shared-data-access-notifications';

export const createRootStore = (config: LoggerConfig) => {
  return configureStore({
    reducer: {
      [LoggerKey]: loggerReducer,
      [NotificationKey]: notificationReducer,
      // Add other reducers here as needed
    },
    middleware: (getDefaultMiddleware) => {
      const defaultMiddleware = getDefaultMiddleware({
        serializableCheck: {
          // Ignore these action types
          ignoredActions: ['persist/PERSIST'],
        },
      });

      return defaultMiddleware.prepend(createLoggerMiddleware(config));
    },
  });
};
