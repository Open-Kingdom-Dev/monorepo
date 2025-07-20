import { configureStore } from '@reduxjs/toolkit';
import {
  LoggerKey,
  loggerMiddleware,
  loggerReducer,
} from '@ynaa/shared-feature-logger';

export const store = configureStore({
  reducer: {
    [LoggerKey]: loggerReducer,
    // Add other reducers here as needed
  },
  middleware: (getDefaultMiddleware) => {
    const defaultMiddleware = getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['persist/PERSIST'],
      },
    });

    return defaultMiddleware.prepend(loggerMiddleware);
  },
});
