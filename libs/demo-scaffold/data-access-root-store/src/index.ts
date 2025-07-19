import { configureStore } from '@reduxjs/toolkit';
import { LoggerKey, loggerReducer } from '@ynaa/shared-util-logger';

export const store = configureStore({
  reducer: {
    [LoggerKey]: loggerReducer,
    // Add other reducers here as needed
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});
