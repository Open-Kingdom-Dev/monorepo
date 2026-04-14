import { HttpInterceptor } from '../interceptor.js';

// Mock global fetch for testing
const mockFetch = jest.fn();
const originalFetch = globalThis.fetch;

describe('HttpInterceptor - fetch interception', () => {
  let interceptor: HttpInterceptor;

  beforeAll(() => {
    globalThis.fetch = mockFetch;
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  beforeEach(() => {
    mockFetch.mockClear();
    interceptor = new HttpInterceptor({ verbose: true });
  });

  afterEach(async () => {
    await interceptor.uninstall();
  });

  describe('URL rewriting', () => {
    beforeEach(async () => {
      interceptor.addRule({
        from: 'https://storage.googleapis.com',
        to: 'http://localhost:9013',
      });
      await interceptor.install();
    });

    it('should rewrite fetch URL when hostname matches', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });

      await globalThis.fetch(
        'https://storage.googleapis.com/storage/v1/b/test'
      );

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:9013/storage/v1/b/test',
        undefined
      );
    });

    it('should rewrite fetch URL with query params', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });

      await globalThis.fetch(
        'https://storage.googleapis.com/storage/v1/b/test?projection=full'
      );

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:9013/storage/v1/b/test?projection=full',
        undefined
      );
    });

    it('should pass through non-matching URLs', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });

      await globalThis.fetch('https://api.example.com/v1/users');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/v1/users',
        undefined
      );
    });

    it('should rewrite fetch with URL object input', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });

      const url = new URL('https://storage.googleapis.com/storage/v1/b/test');
      await globalThis.fetch(url);

      expect(mockFetch).toHaveBeenCalledWith(expect.any(URL), undefined);
      expect((mockFetch.mock.calls[0][0] as URL).toString()).toBe(
        'http://localhost:9013/storage/v1/b/test'
      );
    });

    it('should rewrite fetch with Request object input', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });

      const request = new Request(
        'https://storage.googleapis.com/storage/v1/b/test',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      await globalThis.fetch(request);

      // Request object's URL should be rewritten
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should preserve request init options', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });

      const init = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'data' }),
      };

      await globalThis.fetch(
        'https://storage.googleapis.com/storage/v1/b/test',
        init
      );

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:9013/storage/v1/b/test',
        init
      );
    });
  });

  describe('multiple routing rules', () => {
    beforeEach(async () => {
      interceptor.addRule({
        from: 'https://storage.googleapis.com',
        to: 'http://localhost:9013',
      });
      interceptor.addRule({
        from: 'https://api.example.com',
        to: 'http://localhost:8080',
      });
      await interceptor.install();
    });

    it('should route different domains to different twins', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });

      await globalThis.fetch(
        'https://storage.googleapis.com/storage/v1/b/test'
      );
      await globalThis.fetch('https://api.example.com/v1/users');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch.mock.calls[0][0]).toBe(
        'http://localhost:9013/storage/v1/b/test'
      );
      expect(mockFetch.mock.calls[1][0]).toBe('http://localhost:8080/v1/users');
    });
  });

  describe('path-specific routing', () => {
    beforeEach(async () => {
      interceptor.addRule({
        from: 'https://api.example.com/v1',
        to: 'http://localhost:8080/api',
      });
      await interceptor.install();
    });

    it('should match path prefix', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });

      await globalThis.fetch('https://api.example.com/v1/users/123');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch.mock.calls[0][0]).toBe(
        'http://localhost:8080/api/users/123'
      );
    });

    it('should not match unrelated paths', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });

      await globalThis.fetch('https://api.example.com/v2/users');

      // Should not be intercepted (v2 doesn't match v1 prefix)
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch.mock.calls[0][0]).toBe(
        'https://api.example.com/v2/users'
      );
    });
  });

  describe('uninstall restores original fetch', () => {
    it('should restore original fetch after uninstall', async () => {
      // Store reference to the mock we're using as "original"
      const originalMockFetch = jest
        .fn()
        .mockResolvedValue({ ok: true, status: 200 });
      globalThis.fetch = originalMockFetch;

      // Create new interceptor after setting up original fetch
      const freshInterceptor = new HttpInterceptor({ verbose: true });
      freshInterceptor.addRule({
        from: 'https://storage.googleapis.com',
        to: 'http://localhost:9013',
      });
      await freshInterceptor.install();

      // Should be intercepted (calls originalMockFetch with rewritten URL)
      await globalThis.fetch('https://storage.googleapis.com/test');
      expect(originalMockFetch).toHaveBeenCalledWith(
        'http://localhost:9013/test',
        undefined
      );

      // Uninstall
      await freshInterceptor.uninstall();

      // Reset mock calls
      originalMockFetch.mockClear();

      // Now should pass through unchanged
      await globalThis.fetch('https://storage.googleapis.com/test');
      expect(originalMockFetch).toHaveBeenCalledTimes(1);
      expect(originalMockFetch.mock.calls[0][0]).toBe(
        'https://storage.googleapis.com/test'
      );
    });
  });
});
