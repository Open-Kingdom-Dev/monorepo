import http from 'http';
import https from 'https';
import { AgentInterceptor } from '../interceptor.agents.js';

// Mock http/https modules
jest.mock('http');
jest.mock('https');

const mockHttpGet = jest.fn();
const mockHttpRequest = jest.fn();
const mockHttpsGet = jest.fn();
const mockHttpsRequest = jest.fn();

(http.get as any) = mockHttpGet;
(http.request as any) = mockHttpRequest;
(https.get as any) = mockHttpsGet;
(https.request as any) = mockHttpsRequest;

describe('AgentInterceptor', () => {
  let interceptor: AgentInterceptor;

  beforeEach(() => {
    interceptor = new AgentInterceptor();
    mockHttpGet.mockClear();
    mockHttpRequest.mockClear();
    mockHttpsGet.mockClear();
    mockHttpsRequest.mockClear();

    // Setup mock to return a mock ClientRequest
    const mockRequest = {
      on: jest.fn().mockReturnThis(),
      once: jest.fn().mockReturnThis(),
      end: jest.fn(),
      abort: jest.fn(),
    };
    mockHttpGet.mockReturnValue(mockRequest);
    mockHttpRequest.mockReturnValue(mockRequest);
    mockHttpsGet.mockReturnValue(mockRequest);
    mockHttpsRequest.mockReturnValue(mockRequest);
  });

  afterEach(() => {
    interceptor.uninstall();
  });

  describe('install/uninstall', () => {
    it('should install and wrap http/https methods', () => {
      interceptor.setRules([
        { from: 'https://api.example.com', to: 'http://localhost:8080' },
      ]);
      interceptor.install();

      // Methods should be wrapped (different from original mocks)
      expect(http.get).not.toBe(mockHttpGet);
      expect(http.request).not.toBe(mockHttpRequest);
      expect(https.get).not.toBe(mockHttpsGet);
      expect(https.request).not.toBe(mockHttpsRequest);
    });

    it('should uninstall and restore original methods', () => {
      interceptor.setRules([
        { from: 'https://api.example.com', to: 'http://localhost:8080' },
      ]);
      interceptor.install();
      interceptor.uninstall();

      // Methods should be restored
      expect(http.get).toBe(mockHttpGet);
      expect(http.request).toBe(mockHttpRequest);
      expect(https.get).toBe(mockHttpsGet);
      expect(https.request).toBe(mockHttpsRequest);
    });
  });

  describe('http.get interception', () => {
    beforeEach(() => {
      interceptor.setRules([
        { from: 'https://api.example.com', to: 'http://localhost:8080' },
      ]);
      interceptor.setVerbose(true);
      interceptor.install();
    });

    it('should rewrite matching URL', () => {
      http.get('https://api.example.com/v1/users');

      expect(mockHttpGet).toHaveBeenCalledWith(
        'http://localhost:8080/v1/users',
        undefined,
        undefined
      );
    });

    it('should pass through non-matching URL', () => {
      http.get('https://other-domain.com/test');

      expect(mockHttpGet).toHaveBeenCalledWith(
        'https://other-domain.com/test',
        undefined,
        undefined
      );
    });

    it('should handle URL object input', () => {
      const url = new URL('https://api.example.com/test');
      http.get(url);

      expect(mockHttpGet).toHaveBeenCalled();
      const calledArg = mockHttpGet.mock.calls[0][0];
      // Should be rewritten to localhost
      if (calledArg instanceof URL) {
        expect(calledArg.hostname).toBe('localhost');
        expect(calledArg.port).toBe('8080');
      } else if (typeof calledArg === 'string') {
        expect(calledArg).toContain('localhost:8080');
      } else {
        fail('Expected string or URL');
      }
    });
  });

  describe('http.request interception', () => {
    beforeEach(() => {
      interceptor.setRules([
        { from: 'https://storage.googleapis.com', to: 'http://localhost:9013' },
      ]);
      interceptor.setVerbose(true);
      interceptor.install();
    });

    it('should rewrite matching URL', () => {
      http.request('https://storage.googleapis.com/storage/v1/b/test');

      expect(mockHttpRequest).toHaveBeenCalledWith(
        'http://localhost:9013/storage/v1/b/test',
        undefined,
        undefined
      );
    });

    it('should preserve options object', () => {
      const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      };

      http.request('https://storage.googleapis.com/storage/v1/b/test', options);

      expect(mockHttpRequest).toHaveBeenCalled();
      const call = mockHttpRequest.mock.calls[0];
      expect(call[0]).toBe('http://localhost:9013/storage/v1/b/test');
      expect(call[1]).toEqual(options);
    });
  });

  describe('https.get interception', () => {
    beforeEach(() => {
      interceptor.setRules([
        { from: 'https://api.secure.com', to: 'http://localhost:3000' },
      ]);
      interceptor.setVerbose(true);
      interceptor.install();
    });

    it('should rewrite matching HTTPS URL', () => {
      https.get('https://api.secure.com/data');

      expect(mockHttpsGet).toHaveBeenCalledWith(
        'http://localhost:3000/data',
        undefined,
        undefined
      );
    });
  });

  describe('https.request interception', () => {
    beforeEach(() => {
      interceptor.setRules([
        { from: 'https://api.secure.com', to: 'http://localhost:3000' },
      ]);
      interceptor.setVerbose(true);
      interceptor.install();
    });

    it('should rewrite matching HTTPS request', () => {
      https.request('https://api.secure.com/data', { method: 'POST' });

      expect(mockHttpsRequest).toHaveBeenCalled();
      const call = mockHttpsRequest.mock.calls[0];
      expect(call[0]).toBe('http://localhost:3000/data');
    });
  });

  describe('path-specific routing', () => {
    beforeEach(() => {
      interceptor.setRules([
        { from: 'https://api.example.com/v1', to: 'http://localhost:8080/api' },
      ]);
      interceptor.setVerbose(true);
      interceptor.install();
    });

    it('should replace path prefix', () => {
      http.get('https://api.example.com/v1/users/123');

      expect(mockHttpGet).toHaveBeenCalledWith(
        'http://localhost:8080/api/users/123',
        undefined,
        undefined
      );
    });

    it('should not match unrelated paths', () => {
      http.get('https://api.example.com/v2/users');

      expect(mockHttpGet).toHaveBeenCalledWith(
        'https://api.example.com/v2/users',
        undefined,
        undefined
      );
    });
  });

  describe('multiple rules', () => {
    beforeEach(() => {
      interceptor.setRules([
        { from: 'https://api.example.com', to: 'http://localhost:8080' },
        { from: 'https://storage.googleapis.com', to: 'http://localhost:9013' },
      ]);
      interceptor.setVerbose(true);
      interceptor.install();
    });

    it('should route different domains correctly', () => {
      http.get('https://api.example.com/test');
      http.get('https://storage.googleapis.com/test');

      expect(mockHttpGet.mock.calls[0][0]).toBe('http://localhost:8080/test');
      expect(mockHttpGet.mock.calls[1][0]).toBe('http://localhost:9013/test');
    });
  });
});
