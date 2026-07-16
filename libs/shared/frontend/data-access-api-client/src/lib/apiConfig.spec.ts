import { getApiBaseUrl, setApiBaseUrl } from './apiConfig';

describe('apiConfig', () => {
  const originalEnv = process.env.VITE_API_BASE_URL;

  afterEach(() => {
    setApiBaseUrl(undefined);
    if (originalEnv === undefined) {
      delete process.env.VITE_API_BASE_URL;
    } else {
      process.env.VITE_API_BASE_URL = originalEnv;
    }
  });

  it('defaults to the environment value', () => {
    process.env.VITE_API_BASE_URL = 'http://env.example';
    expect(getApiBaseUrl()).toBe('http://env.example');
  });

  it('defaults to empty string (same-origin) when the env var is unset', () => {
    delete process.env.VITE_API_BASE_URL;
    expect(getApiBaseUrl()).toBe('');
  });

  it('setApiBaseUrl overrides the environment value', () => {
    process.env.VITE_API_BASE_URL = 'http://env.example';
    setApiBaseUrl('/api/app/instance-1');
    expect(getApiBaseUrl()).toBe('/api/app/instance-1');
  });

  it('is resolved at call time — a later set takes effect', () => {
    setApiBaseUrl('/mount/a');
    expect(getApiBaseUrl()).toBe('/mount/a');
    setApiBaseUrl('/mount/b');
    expect(getApiBaseUrl()).toBe('/mount/b');
  });

  it('setApiBaseUrl(undefined) restores the environment default', () => {
    process.env.VITE_API_BASE_URL = 'http://env.example';
    setApiBaseUrl('/mount/a');
    setApiBaseUrl(undefined);
    expect(getApiBaseUrl()).toBe('http://env.example');
  });

  it('treats an empty-string override as unset', () => {
    process.env.VITE_API_BASE_URL = 'http://env.example';
    setApiBaseUrl('');
    expect(getApiBaseUrl()).toBe('http://env.example');
  });
});
