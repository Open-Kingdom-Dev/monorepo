import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { AuthKey, AuthState, getAuthAdapter } from './auth.slice';

export const ApiKey = 'api';

export const baseApi = createApi({
  reducerPath: ApiKey,
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.VITE_API_BASE_URL || '',
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as { [AuthKey]?: AuthState };
      const authState = state[AuthKey];
      const token = authState ? authState.token : undefined;
      const adapter = getAuthAdapter();

      if (token) {
        if (adapter) {
          adapter.prepareHeaders(headers, token);
        } else {
          headers.set('Authorization', `Bearer ${token}`);
        }
      }

      return headers;
    },
  }),
  endpoints: () => ({}),
});

export const apiReducer = baseApi.reducer;
export const apiMiddleware = baseApi.middleware;
