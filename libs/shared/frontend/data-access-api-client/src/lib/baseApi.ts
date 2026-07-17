import {
  BaseQueryFn,
  createApi,
  FetchArgs,
  fetchBaseQuery,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { AuthKey, AuthState, getAuthAdapter } from './auth.slice';
import { getApiBaseUrl } from './apiConfig';

export const ApiKey = 'api';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: '',
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
});

// Resolves the base URL per request (fetchBaseQuery only accepts a static
// string) so `setApiBaseUrl()` takes effect at runtime. Default behavior is
// unchanged: with no runtime override, `getApiBaseUrl()` returns the
// build-time VITE_API_BASE_URL define (or '' for same-origin).
const dynamicBaseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = (args, api, extraOptions) => {
  const base = getApiBaseUrl().replace(/\/+$/, '');
  if (!base) return rawBaseQuery(args, api, extraOptions);

  const prepend = (url: string) =>
    `${base}${url.startsWith('/') ? '' : '/'}${url}`;
  const adjusted =
    typeof args === 'string'
      ? prepend(args)
      : { ...args, url: prepend(args.url) };
  return rawBaseQuery(adjusted, api, extraOptions);
};

export const baseApi = createApi({
  reducerPath: ApiKey,
  baseQuery: dynamicBaseQuery,
  endpoints: () => ({}),
});

export const apiReducer = baseApi.reducer;
export const apiMiddleware = baseApi.middleware;
