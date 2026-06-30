import { RoutingTable } from '../routing-table.js';
import { NodeInterceptor } from '../node-interceptor.js';

describe('RoutingTable', () => {
  it('should add entries and resolve matched URLs correctly', () => {
    const table = new RoutingTable([
      { hostname: 'gmail.googleapis.com', target: 'http://localhost:9014' },
    ]);

    const resolved = table.resolve(
      'https://gmail.googleapis.com/v1/users/me/messages'
    );
    expect(resolved).toBe('http://localhost:9014/v1/users/me/messages');
  });

  it('should preserve query parameters during rewrite', () => {
    const table = new RoutingTable([
      { hostname: 'gmail.googleapis.com', target: 'http://localhost:9014' },
    ]);

    const resolved = table.resolve(
      'https://gmail.googleapis.com/messages?maxResults=10&draft=true'
    );
    expect(resolved).toBe(
      'http://localhost:9014/messages?maxResults=10&draft=true'
    );
  });

  it('should perform case-insensitive host matching', () => {
    const table = new RoutingTable([
      { hostname: 'GMAIL.googleapis.com', target: 'http://localhost:9014' },
    ]);

    const resolved = table.resolve('https://gmail.googleapis.com/v1/messages');
    expect(resolved).toBe('http://localhost:9014/v1/messages');
  });

  it('should restrict resolution by pathPrefix if provided', () => {
    const table = new RoutingTable([
      {
        hostname: 'example.com',
        target: 'http://localhost:8080',
        pathPrefix: '/api',
      },
      {
        hostname: 'www.googleapis.com',
        target: 'http://localhost:9016',
        pathPrefix: '/youtube/',
      },
    ]);

    // Matches pathPrefix
    const resolvedApi = table.resolve('https://example.com/api/v1/users');
    expect(resolvedApi).toBe('http://localhost:8080/api/v1/users');

    const resolvedYoutube = table.resolve(
      'https://www.googleapis.com/youtube/v3/search'
    );
    expect(resolvedYoutube).toBe('http://localhost:9016/youtube/v3/search');

    // Does not match pathPrefix
    const resolvedWeb = table.resolve('https://example.com/web/home');
    expect(resolvedWeb).toBeNull();
  });

  it('should return null for non-matching hostnames', () => {
    const table = new RoutingTable([
      { hostname: 'gmail.googleapis.com', target: 'http://localhost:9014' },
    ]);

    const resolved = table.resolve('https://google.com/search');
    expect(resolved).toBeNull();
  });

  it('should handle malformed URLs gracefully by returning null', () => {
    const table = new RoutingTable([
      { hostname: 'gmail.googleapis.com', target: 'http://localhost:9014' },
    ]);

    const resolved = table.resolve('not-a-valid-url');
    expect(resolved).toBeNull();
  });
});

describe('NodeInterceptor', () => {
  let routingTable: RoutingTable;
  let interceptor: NodeInterceptor;
  let mockOriginalFetch: jest.Mock;
  let originalGlobalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalGlobalFetch = globalThis.fetch;
    routingTable = new RoutingTable([
      { hostname: 'gmail.googleapis.com', target: 'http://localhost:9014' },
    ]);
    interceptor = new NodeInterceptor(routingTable);

    mockOriginalFetch = jest.fn().mockResolvedValue({
      status: 200,
      json: async () => ({ success: true }),
    });

    globalThis.fetch = mockOriginalFetch;
  });

  afterEach(() => {
    interceptor.uninstall();
    globalThis.fetch = originalGlobalFetch;
  });

  it('should override globalThis.fetch on install and restore on uninstall', () => {
    expect(globalThis.fetch).toBe(mockOriginalFetch);

    interceptor.install();
    expect(globalThis.fetch).not.toBe(mockOriginalFetch);
    expect(interceptor.isActive()).toBe(true);

    interceptor.uninstall();
    expect(globalThis.fetch).toBe(mockOriginalFetch);
    expect(interceptor.isActive()).toBe(false);
  });

  it('should be idempotent on install and uninstall', () => {
    interceptor.install();
    const firstOverride = globalThis.fetch;

    // Second install should be a no-op
    interceptor.install();
    expect(globalThis.fetch).toBe(firstOverride);

    // Safe uninstalls
    interceptor.uninstall();
    expect(globalThis.fetch).toBe(mockOriginalFetch);

    // Second uninstall should be a safe no-op
    interceptor.uninstall();
    expect(globalThis.fetch).toBe(mockOriginalFetch);
  });

  it('should forward non-matching URLs untouched to original fetch', async () => {
    interceptor.install();

    const response = await fetch('https://google.com/search', {
      method: 'GET',
    });
    expect(mockOriginalFetch).toHaveBeenCalledWith(
      'https://google.com/search',
      { method: 'GET' }
    );
    expect(response.status).toBe(200);
  });

  it('should rewrite matching URLs and inject X-Original-Host header', async () => {
    interceptor.install();

    await fetch('https://gmail.googleapis.com/v1/users/me/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect(mockOriginalFetch).toHaveBeenCalledWith(
      'http://localhost:9014/v1/users/me/messages',
      expect.objectContaining({
        method: 'POST',
        headers: expect.any(Headers),
      })
    );

    const calledHeaders = mockOriginalFetch.mock.calls[0][1].headers as Headers;
    expect(calledHeaders.get('Content-Type')).toBe('application/json');
    expect(calledHeaders.get('X-Original-Host')).toBe('gmail.googleapis.com');
  });

  it('should support URL object parameters', async () => {
    interceptor.install();

    const url = new URL('https://gmail.googleapis.com/v1/messages');
    await fetch(url, { method: 'GET' });

    expect(mockOriginalFetch).toHaveBeenCalledWith(
      'http://localhost:9014/v1/messages',
      expect.any(Object)
    );
  });

  it('should support and correctly rewrite native Request parameters', async () => {
    interceptor.install();

    const originalRequest = new Request(
      'https://gmail.googleapis.com/v1/users/me/send',
      {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer test-token',
        },
      }
    );

    await fetch(originalRequest);

    expect(mockOriginalFetch).toHaveBeenCalledWith(expect.any(Request));

    const forwardedRequest = mockOriginalFetch.mock.calls[0][0] as Request;
    expect(forwardedRequest.url).toBe('http://localhost:9014/v1/users/me/send');
    expect(forwardedRequest.method).toBe('PUT');
    expect(forwardedRequest.headers.get('Authorization')).toBe(
      'Bearer test-token'
    );
    expect(forwardedRequest.headers.get('X-Original-Host')).toBe(
      'gmail.googleapis.com'
    );
  });

  it('should support and correctly rewrite native Request parameters including body', async () => {
    interceptor.install();

    const originalRequest = new Request(
      'https://gmail.googleapis.com/v1/users/me/send',
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-token',
        },
        body: 'test-body',
      }
    );

    await fetch(originalRequest);

    expect(mockOriginalFetch).toHaveBeenCalledWith(expect.any(Request));

    const forwardedRequest = mockOriginalFetch.mock.calls[0][0] as Request;
    expect(forwardedRequest.url).toBe('http://localhost:9014/v1/users/me/send');
    expect(forwardedRequest.method).toBe('POST');
    expect(forwardedRequest.headers.get('Authorization')).toBe(
      'Bearer test-token'
    );
    expect(forwardedRequest.headers.get('X-Original-Host')).toBe(
      'gmail.googleapis.com'
    );
    expect(forwardedRequest.body).toBeDefined();
  });
});
