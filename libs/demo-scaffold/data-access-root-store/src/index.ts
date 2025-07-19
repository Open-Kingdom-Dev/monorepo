import { configureStore } from '@reduxjs/toolkit';
// import { loggerReducer } from '@ynaa/shared-util-logger';

export const store = configureStore({
  reducer: {
    // logger: loggerReducer,
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

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;