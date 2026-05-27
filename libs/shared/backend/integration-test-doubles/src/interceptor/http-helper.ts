import http from 'http';

export interface ParsedRequestArgs {
  urlObj: URL;
  options: http.RequestOptions;
  callback?: (res: http.IncomingMessage) => void;
}

/**
 * Standardizes the polymorphic arguments of http.request / https.request
 * into a single unified object with urlObj, options, and callback.
 */
export function parseHttpArguments(
  moduleProtocol: string,
  arg1: string | URL | http.RequestOptions,
  arg2?: http.RequestOptions | ((res: http.IncomingMessage) => void),
  arg3?: (res: http.IncomingMessage) => void
): ParsedRequestArgs {
  let urlObj: URL;
  let options: http.RequestOptions = {};
  let callback: ((res: http.IncomingMessage) => void) | undefined = undefined;

  if (typeof arg1 === 'string') {
    urlObj = new URL(arg1);
    if (typeof arg2 === 'object' && arg2 !== null) {
      options = arg2;
      callback = arg3;
    } else if (typeof arg2 === 'function') {
      callback = arg2;
    }
  } else if (arg1 instanceof URL) {
    urlObj = arg1;
    if (typeof arg2 === 'object' && arg2 !== null) {
      options = arg2;
      callback = arg3;
    } else if (typeof arg2 === 'function') {
      callback = arg2;
    }
  } else {
    options = arg1 || {};
    if (typeof arg2 === 'function') {
      callback = arg2;
    }
    const protocol = options.protocol || moduleProtocol;
    const host =
      options.host ||
      (options.hostname
        ? `${options.hostname}${
            options.port !== undefined && options.port !== null
              ? `:${options.port}`
              : ''
          }`
        : '');
    const path = options.path || '/';
    urlObj = new URL(`${protocol}//${host}${path}`);
  }

  return { urlObj, options, callback };
}

/**
 * Safely copies headers and injects the 'X-Original-Host' tracking header,
 * handling both object-based (OutgoingHttpHeaders) and array-based (string[]) formats.
 */
export function injectOriginalHostHeader(
  options: http.RequestOptions,
  originalHost: string
): http.RequestOptions {
  const newOptions = { ...options };

  if (options.headers) {
    if (Array.isArray(options.headers)) {
      const headersArr = [...options.headers];
      headersArr.push('X-Original-Host', originalHost);
      newOptions.headers = headersArr;
    } else {
      const headersObj: http.OutgoingHttpHeaders = {
        ...(options.headers as http.OutgoingHttpHeaders),
      };
      headersObj['X-Original-Host'] = originalHost;
      newOptions.headers = headersObj;
    }
  } else {
    newOptions.headers = {
      'X-Original-Host': originalHost,
    };
  }

  return newOptions;
}

/**
 * Creates new RequestOptions targeting a rewritten URL destination.
 */
export function rewriteRequestOptions(
  options: http.RequestOptions,
  rewrittenUrl: URL
): http.RequestOptions {
  return {
    ...options,
    protocol: rewrittenUrl.protocol,
    hostname: rewrittenUrl.hostname,
    port: rewrittenUrl.port,
    path: rewrittenUrl.pathname + rewrittenUrl.search,
  };
}

/**
 * Safely invokes a request function with options and an optional callback.
 */
export function callRequestWithOptions(
  requestFn: typeof http.request,
  options: http.RequestOptions,
  callback?: (res: http.IncomingMessage) => void
): http.ClientRequest {
  const fn = requestFn as (
    options: http.RequestOptions,
    callback?: (res: http.IncomingMessage) => void
  ) => http.ClientRequest;
  return fn(options, callback);
}

/**
 * Safely invokes a request function with a URL/string, options, and an optional callback.
 */
export function callRequestWithUrlAndOptions(
  requestFn: typeof http.request,
  url: string | URL,
  options: http.RequestOptions,
  callback?: (res: http.IncomingMessage) => void
): http.ClientRequest {
  const fn = requestFn as (
    url: string | URL,
    options: http.RequestOptions,
    callback?: (res: http.IncomingMessage) => void
  ) => http.ClientRequest;
  return fn(url, options, callback);
}

/**
 * Safely invokes a request function with a URL/string and an optional callback.
 */
export function callRequestWithUrl(
  requestFn: typeof http.request,
  url: string | URL,
  callback?: (res: http.IncomingMessage) => void
): http.ClientRequest {
  const fn = requestFn as (
    url: string | URL,
    callback?: (res: http.IncomingMessage) => void
  ) => http.ClientRequest;
  return fn(url, callback);
}

/**
 * Forwards arguments untouched to the original request function.
 */
export function forwardToOriginalRequest(
  originalRequest: typeof http.request,
  arg1: string | URL | http.RequestOptions,
  arg2?: http.RequestOptions | ((res: http.IncomingMessage) => void),
  callback?: (res: http.IncomingMessage) => void
): http.ClientRequest {
  if (typeof arg1 === 'string' || arg1 instanceof URL) {
    if (typeof arg2 === 'object' && arg2 !== null) {
      return callRequestWithUrlAndOptions(
        originalRequest,
        arg1,
        arg2,
        callback
      );
    } else {
      const cb = typeof arg2 === 'function' ? arg2 : callback;
      return callRequestWithUrl(originalRequest, arg1, cb);
    }
  } else {
    return callRequestWithOptions(originalRequest, arg1, callback);
  }
}
