import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { AuthAdapter } from './adapters/adapters.types';

export const ApiKey = 'api';

let globalAdapter: AuthAdapter | null = null;

export function configureApiClient(config: { authAdapter: AuthAdapter }) {
  globalAdapter = config.authAdapter;
}

export const baseApi = createApi({
  reducerPath: ApiKey,
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.VITE_API_BASE_URL || '',
    prepareHeaders: (headers) => {
      if (globalAdapter) {
        globalAdapter.prepareHeaders(headers);
      }
      return headers;
    },
  }),
  endpoints: () => ({}),
});

export const apiReducer = baseApi.reducer;
export const apiMiddleware = baseApi.middleware;
