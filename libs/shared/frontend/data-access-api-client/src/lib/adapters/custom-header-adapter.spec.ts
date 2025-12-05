import { createCustomHeaderAdapter } from './custom-header-adapter.js';

describe('createCustomHeaderAdapter', () => {
  it('sets header with token value', () => {
    const adapter = createCustomHeaderAdapter({ headerName: 'X-Auth-Token' });
    const headers = new Headers();

    adapter.prepareHeaders(headers, 'test-token');

    expect(headers.get('X-Auth-Token')).toBe('test-token');
  });

  it('uses formatValue when provided', () => {
    const adapter = createCustomHeaderAdapter({
      headerName: 'Authorization',
      formatValue: (token: string) => `Bearer ${token}`,
    });
    const headers = new Headers();

    adapter.prepareHeaders(headers, 'my-token');

    expect(headers.get('Authorization')).toBe('Bearer my-token');
  });
});
