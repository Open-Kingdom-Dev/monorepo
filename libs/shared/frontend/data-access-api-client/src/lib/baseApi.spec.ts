import { configureStore } from '@reduxjs/toolkit';
import { baseApi, apiReducer, apiMiddleware, ApiKey } from './baseApi';
import { setApiBaseUrl } from './apiConfig';
import { AuthKey, authReducer, setAuthAdapter, setToken } from './auth.slice';

// Request-level coverage for the dynamic base URL: the baseQuery must resolve
// getApiBaseUrl() per request, so setApiBaseUrl() calls take effect even
// between two requests on the same store. Also covers the prepareHeaders
// token/adapter branches (previously excluded from coverage).
const testApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    ping: builder.query<unknown, void>({ query: () => '/api/ping' }),
    pingArgs: builder.query<unknown, void>({
      query: () => ({ url: 'api/ping-args', method: 'GET' }),
    }),
  }),
});

function makeStore() {
  return configureStore({
    reducer: { [ApiKey]: apiReducer, [AuthKey]: authReducer },
    middleware: (getDefault) => getDefault().concat(apiMiddleware),
  });
}

describe('baseApi dynamic base URL', () => {
  const originalEnv = process.env.VITE_API_BASE_URL;
  let fetchMock: jest.SpyInstance;

  beforeEach(() => {
    fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      );
  });

  afterEach(() => {
    setApiBaseUrl(undefined);
    if (originalEnv === undefined) {
      delete process.env.VITE_API_BASE_URL;
    } else {
      process.env.VITE_API_BASE_URL = originalEnv;
    }
    fetchMock.mockRestore();
  });

  const requestedUrl = (call: number) => {
    const arg = fetchMock.mock.calls[call][0];
    return arg instanceof Request ? arg.url : String(arg);
  };

  // The '' default produces relative same-origin URLs, which only a browser
  // can issue — Node's fetch requires absolute URLs. The env-default path is
  // asserted here instead; the '' case is covered by apiConfig.spec.ts.
  it('uses the environment base URL when no runtime override is set', async () => {
    process.env.VITE_API_BASE_URL = 'http://env.example';
    const store = makeStore();
    await store.dispatch(testApi.endpoints.ping.initiate());
    expect(requestedUrl(0)).toBe('http://env.example/api/ping');
  });

  it('prepends the runtime base URL set via setApiBaseUrl', async () => {
    setApiBaseUrl('http://host.example/api/app/crm-1');
    const store = makeStore();
    await store.dispatch(testApi.endpoints.ping.initiate());
    expect(requestedUrl(0)).toBe('http://host.example/api/app/crm-1/api/ping');
  });

  it('resolves the base per request — a change between requests takes effect', async () => {
    setApiBaseUrl('http://host.example/mount-a');
    const storeA = makeStore();
    await storeA.dispatch(testApi.endpoints.ping.initiate());

    setApiBaseUrl('http://host.example/mount-b');
    const storeB = makeStore();
    await storeB.dispatch(testApi.endpoints.ping.initiate());

    expect(requestedUrl(0)).toBe('http://host.example/mount-a/api/ping');
    expect(requestedUrl(1)).toBe('http://host.example/mount-b/api/ping');
  });

  it('tolerates a trailing slash on the configured base', async () => {
    setApiBaseUrl('http://host.example/mount/');
    const store = makeStore();
    await store.dispatch(testApi.endpoints.ping.initiate());
    expect(requestedUrl(0)).toBe('http://host.example/mount/api/ping');
  });

  it('prepends the base to FetchArgs-object queries, inserting a missing slash', async () => {
    setApiBaseUrl('http://host.example/mount');
    const store = makeStore();
    await store.dispatch(testApi.endpoints.pingArgs.initiate());
    expect(requestedUrl(0)).toBe('http://host.example/mount/api/ping-args');
  });

  it('sends the default Authorization header when a token is present', async () => {
    setApiBaseUrl('http://host.example');
    const store = makeStore();
    store.dispatch(setToken('tok-123'));
    await store.dispatch(testApi.endpoints.ping.initiate());
    const req = fetchMock.mock.calls[0][0] as Request;
    expect(req.headers.get('Authorization')).toBe('Bearer tok-123');
  });

  it('delegates header preparation to a configured auth adapter', async () => {
    const adapter = { prepareHeaders: jest.fn() };
    setAuthAdapter(adapter);
    setApiBaseUrl('http://host.example');
    try {
      const store = makeStore();
      store.dispatch(setToken('tok-456'));
      await store.dispatch(testApi.endpoints.ping.initiate());
      expect(adapter.prepareHeaders).toHaveBeenCalledWith(
        expect.anything(),
        'tok-456'
      );
    } finally {
      setAuthAdapter(null);
    }
  });
});
