import { configureStore } from '@reduxjs/toolkit';
import {
  LoggerConfig,
  LoggerKey,
  createLoggerMiddleware,
  loggerReducer,
  addLog,
} from '@open-kingdom/shared-frontend-data-access-logger';
import {
  NotificationKey,
  notificationReducer,
  showErrorNotification,
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
import { createReduxRTKErrorMiddleware } from '@open-kingdom/shared-frontend-feature-error-autologger';

export const createRootStore = (config: LoggerConfig) => {
  const rtkErrorMiddleware = createReduxRTKErrorMiddleware({
    logAction: addLog,
    notifyAction: showErrorNotification,
    defaultMessage: 'API request failed',
  });

  return configureStore({
    reducer: {
      [LoggerKey]: loggerReducer,
      [NotificationKey]: notificationReducer,
      [DataGridKey]: dataGridReducer,
      [ApiKey]: apiReducer,
      [AuthKey]: authReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ['persist/PERSIST'],
        },
      })
        .prepend(createLoggerMiddleware(config))
        .prepend(createAuthHydrationMiddleware())
        .concat(apiMiddleware)
        .concat(createAuthListenerMiddleware())
        .concat(rtkErrorMiddleware),
  });
};
