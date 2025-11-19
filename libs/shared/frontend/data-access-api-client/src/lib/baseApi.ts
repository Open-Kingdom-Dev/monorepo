import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const ApiKey = 'api';

const getToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return window.localStorage.getItem('token');
  } catch {
    return null;
  }
};

export const baseApi = createApi({
  reducerPath: ApiKey,
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.VITE_API_BASE_URL || '',
    prepareHeaders: (headers) => {
      const token = getToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: () => ({}),
});

export const apiReducer = baseApi.reducer;
export const apiMiddleware = baseApi.middleware;
