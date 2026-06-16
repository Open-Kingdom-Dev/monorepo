import { configureStore } from '@reduxjs/toolkit';
import {
  LoggerKey,
  createConsoleLoggerMiddleware,
  createHttpLoggerMiddleware,
  loggerReducer,
  addLog,
} from '@open-kingdom/shared-frontend-data-access-logger';
import {
  NotificationKey,
  notificationReducer,
  showErrorNotification,
} from '@open-kingdom/shared-frontend-data-access-notifications';
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
import {
  CatFactsApiKey,
  catFactsApiReducer,
  catFactsApiMiddleware,
} from '@open-kingdom/shared-frontend-data-access-external-api';

export const createRootStore = () => {
  const rtkErrorMiddleware = createReduxRTKErrorMiddleware({
    logAction: addLog,
    notifyAction: showErrorNotification,
  });

  return configureStore({
    reducer: {
      [LoggerKey]: loggerReducer,
      [NotificationKey]: notificationReducer,
      [ApiKey]: apiReducer,
      [AuthKey]: authReducer,
      [CatFactsApiKey]: catFactsApiReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ['persist/PERSIST'],
        },
      })
        .prepend(createConsoleLoggerMiddleware())
        .prepend(createHttpLoggerMiddleware())
        .prepend(createAuthHydrationMiddleware())
        .concat(apiMiddleware)
        .concat(catFactsApiMiddleware)
        .concat(createAuthListenerMiddleware())
        .concat(rtkErrorMiddleware),
  });
};
