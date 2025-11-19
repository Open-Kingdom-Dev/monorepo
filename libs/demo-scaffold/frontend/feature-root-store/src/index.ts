import { configureStore } from '@reduxjs/toolkit';
import {
  LoggerConfig,
  LoggerKey,
  createLoggerMiddleware,
  loggerReducer,
} from '@open-kingdom/shared-frontend-data-access-logger';
import {
  NotificationKey,
  notificationReducer,
} from '@open-kingdom/shared-frontend-data-access-notifications';
import {
  DataGridKey,
  dataGridReducer,
} from '@open-kingdom/shared-frontend-ui-datagrid';
import {
  ApiKey,
  apiReducer,
  apiMiddleware,
  AuthKey,
  authReducer,
  createAuthListenerMiddleware,
  createAuthHydrationMiddleware,
} from '@open-kingdom/shared-frontend-data-access-api-client';

export const createRootStore = (config: LoggerConfig) => {
  return configureStore({
    reducer: {
      [LoggerKey]: loggerReducer,
      [NotificationKey]: notificationReducer,
      [DataGridKey]: dataGridReducer,
      [ApiKey]: apiReducer,
      [AuthKey]: authReducer,
    },
    middleware: (getDefaultMiddleware) => {
      const defaultMiddleware = getDefaultMiddleware({
        serializableCheck: {
          // Ignore these action types
          ignoredActions: ['persist/PERSIST'],
        },
      });

      return defaultMiddleware
        .prepend(createLoggerMiddleware(config))
        .prepend(createAuthHydrationMiddleware())
        .concat(apiMiddleware)
        .concat(createAuthListenerMiddleware());
    },
  });
};
