import http from 'http';
import {
  parseHttpArguments,
  injectOriginalHostHeader,
  rewriteRequestOptions,
  callRequestWithOptions,
  callRequestWithUrlAndOptions,
  callRequestWithUrl,
  forwardToOriginalRequest,
} from '../http-helper.js';

describe('http-helper', () => {
  describe('parseHttpArguments', () => {
    it('should parse URL string and options and callback', () => {
      const callback = jest.fn();
      const options = { method: 'POST' };
      const parsed = parseHttpArguments(
        'https:',
        'https://example.com/api',
        options,
        callback
      );

      expect(parsed.urlObj.href).toBe('https://example.com/api');
      expect(parsed.options).toEqual(options);
      expect(parsed.callback).toBe(callback);
    });

    it('should parse URL string and callback only', () => {
      const callback = jest.fn();
      const parsed = parseHttpArguments(
        'https:',
        'https://example.com/api',
        callback
      );

      expect(parsed.urlObj.href).toBe('https://example.com/api');
      expect(parsed.options).toEqual({});
      expect(parsed.callback).toBe(callback);
    });

    it('should parse URL object and options and callback', () => {
      const callback = jest.fn();
      const options = { method: 'POST' };
      const url = new URL('https://example.com/api');
      const parsed = parseHttpArguments('https:', url, options, callback);

      expect(parsed.urlObj).toBe(url);
      expect(parsed.options).toEqual(options);
      expect(parsed.callback).toBe(callback);
    });

    it('should parse URL object and callback only', () => {
      const callback = jest.fn();
      const url = new URL('https://example.com/api');
      const parsed = parseHttpArguments('https:', url, callback);

      expect(parsed.urlObj).toBe(url);
      expect(parsed.options).toEqual({});
      expect(parsed.callback).toBe(callback);
    });

    it('should parse options object and callback', () => {
      const callback = jest.fn();
      const options: http.RequestOptions = {
        hostname: 'example.com',
        port: 8080,
        path: '/api',
        protocol: 'https:',
      };
      const parsed = parseHttpArguments('http:', options, callback);

      expect(parsed.urlObj.href).toBe('https://example.com:8080/api');
      expect(parsed.options).toBe(options);
      expect(parsed.callback).toBe(callback);
    });

    it('should fall back to module protocol and path defaults when parsing options', () => {
      const options: http.RequestOptions = {
        host: 'example.com',
      };
      const parsed = parseHttpArguments('http:', options);

      expect(parsed.urlObj.href).toBe('http://example.com/');
    });
  });

  describe('injectOriginalHostHeader', () => {
    it('should inject tracking header when options has headers object', () => {
      const options: http.RequestOptions = {
        headers: { 'Content-Type': 'application/json' },
      };
      const updated = injectOriginalHostHeader(options, 'gmail.googleapis.com');
      expect(updated.headers).toEqual({
        'Content-Type': 'application/json',
        'X-Original-Host': 'gmail.googleapis.com',
      });
    });

    it('should inject tracking header when options has headers array', () => {
      const options: http.RequestOptions = {
        headers: ['Content-Type', 'application/json'],
      };
      const updated = injectOriginalHostHeader(options, 'gmail.googleapis.com');
      expect(updated.headers).toEqual([
        'Content-Type',
        'application/json',
        'X-Original-Host',
        'gmail.googleapis.com',
      ]);
    });

    it('should inject tracking header when options has no headers', () => {
      const options: http.RequestOptions = {};
      const updated = injectOriginalHostHeader(options, 'gmail.googleapis.com');
      expect(updated.headers).toEqual({
        'X-Original-Host': 'gmail.googleapis.com',
      });
    });
  });

  describe('rewriteRequestOptions', () => {
    it('should target rewritten URL', () => {
      const options: http.RequestOptions = { method: 'GET' };
      const url = new URL('http://localhost:9014/v1/messages?foo=bar');
      const rewritten = rewriteRequestOptions(options, url);

      expect(rewritten.protocol).toBe('http:');
      expect(rewritten.hostname).toBe('localhost');
      expect(rewritten.port).toBe('9014');
      expect(rewritten.path).toBe('/v1/messages?foo=bar');
      expect(rewritten.method).toBe('GET');
    });
  });

  describe('callRequest helper wrappers', () => {
    const mockRequestFn = jest.fn();
    const mockCallback = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('callRequestWithOptions should call requestFn with options and callback', () => {
      const options = { host: 'example.com' };
      callRequestWithOptions(mockRequestFn as any, options, mockCallback);
      expect(mockRequestFn).toHaveBeenCalledWith(options, mockCallback);
    });

    it('callRequestWithUrlAndOptions should call requestFn with url, options, and callback', () => {
      const options = { host: 'example.com' };
      callRequestWithUrlAndOptions(
        mockRequestFn as any,
        'http://example.com',
        options,
        mockCallback
      );
      expect(mockRequestFn).toHaveBeenCalledWith(
        'http://example.com',
        options,
        mockCallback
      );
    });

    it('callRequestWithUrl should call requestFn with url and callback', () => {
      callRequestWithUrl(
        mockRequestFn as any,
        'http://example.com',
        mockCallback
      );
      expect(mockRequestFn).toHaveBeenCalledWith(
        'http://example.com',
        mockCallback
      );
    });
  });

  describe('forwardToOriginalRequest', () => {
    const mockRequestFn = jest.fn();
    const mockCallback = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should forward URL string and options and callback', () => {
      const options = { method: 'GET' };
      forwardToOriginalRequest(
        mockRequestFn as any,
        'http://example.com',
        options,
        mockCallback
      );
      expect(mockRequestFn).toHaveBeenCalledWith(
        'http://example.com',
        options,
        mockCallback
      );
    });

    it('should forward URL string and callback only', () => {
      forwardToOriginalRequest(
        mockRequestFn as any,
        'http://example.com',
        mockCallback
      );
      expect(mockRequestFn).toHaveBeenCalledWith(
        'http://example.com',
        mockCallback
      );
    });

    it('should forward options object and callback', () => {
      const options = { host: 'example.com' };
      forwardToOriginalRequest(mockRequestFn as any, options, mockCallback);
      expect(mockRequestFn).toHaveBeenCalledWith(options, mockCallback);
    });
  });
});
