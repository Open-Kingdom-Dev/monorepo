import http from 'http';
import https from 'https';
import { RoutingTable } from './routing-table.js';
import {
  parseHttpArguments,
  injectOriginalHostHeader,
  rewriteRequestOptions,
  callRequestWithOptions,
  callRequestWithUrlAndOptions,
  callRequestWithUrl,
  forwardToOriginalRequest,
} from './http-helper.js';

export class NodeInterceptor {
  private originalFetch: typeof globalThis.fetch | null = null;
  private originalHttpRequest: typeof http.request | null = null;
  private originalHttpGet: typeof http.get | null = null;
  private originalHttpsRequest: typeof https.request | null = null;
  private originalHttpsGet: typeof https.get | null = null;

  private readonly routingTable: RoutingTable;
  private active = false;

  constructor(routingTable: RoutingTable) {
    this.routingTable = routingTable;
  }

  /**
   * Installs interception hooks for both global fetch and node http/https modules.
   */
  install(): void {
    if (this.active) {
      return; // Idempotency guard
    }

    this.interceptFetch();
    this.interceptHttpAndHttpsRequests();

    this.active = true;
  }

  /**
   * Restores fetch and http/https modules to their original native states.
   */
  uninstall(): void {
    if (!this.active) {
      return;
    }

    this.restoreFetch();
    this.restoreHttpAndHttpsRequests();

    this.active = false;
  }

  /**
   * Checks if interception is currently active.
   */
  isActive(): boolean {
    return this.active;
  }

  /**
   * Monkey-patches the global fetch API to redirect requests based on the RoutingTable.
   */
  private interceptFetch(): void {
    this.originalFetch = globalThis.fetch;
    const originalFetch = this.originalFetch;
    const routingTable = this.routingTable;

    globalThis.fetch = async (
      input: Parameters<typeof globalThis.fetch>[0],
      init?: Parameters<typeof globalThis.fetch>[1]
    ): Promise<Response> => {
      let urlStr = '';

      if (typeof input === 'string') {
        urlStr = input;
      } else if (input instanceof URL) {
        urlStr = input.toString();
      } else if (input instanceof Request) {
        urlStr = input.url;
      }

      const rewritten = routingTable.resolve(urlStr);

      if (rewritten) {
        const originalHost = new URL(urlStr).host;
        const headers = new Headers();

        // 1. Copy headers from input Request if it exists
        if (input instanceof Request) {
          input.headers.forEach((value, key) => {
            headers.set(key, value);
          });
        }

        // 2. Overwrite with any headers passed in init
        if (init?.headers) {
          const initHeaders = new Headers(init.headers);
          initHeaders.forEach((value, key) => {
            headers.set(key, value);
          });
        }

        // 3. Inject X-Original-Host tracking header
        headers.set('X-Original-Host', originalHost);

        // Handle native Request object conversion cleanly
        if (input instanceof Request) {
          const newInit: RequestInit = {
            method: input.method,
            headers: headers,
            body: input.body,
            signal: input.signal,
            credentials: input.credentials,
            mode: input.mode,
            referrer: input.referrer,
            redirect: input.redirect,
            ...init,
          };
          const newRequest = new Request(rewritten, newInit);
          return originalFetch(newRequest);
        }

        // Handle string/URL input
        return originalFetch(rewritten, {
          ...init,
          headers,
        });
      }

      // No match - forward request untouched
      return originalFetch(input, init);
    };
  }

  /**
   * Monkey-patches Node's native http/https request methods.
   */
  private interceptHttpAndHttpsRequests(): void {
    this.originalHttpRequest = http.request;
    this.originalHttpGet = http.get;
    this.originalHttpsRequest = https.request;
    this.originalHttpsGet = https.get;

    // Helper to generate a patched request method for http or https
    const createPatchedRequest = (
      moduleProtocol: string,
      originalRequest: typeof http.request
    ) => {
      return (
        arg1: string | URL | http.RequestOptions,
        arg2?: http.RequestOptions | ((res: http.IncomingMessage) => void),
        arg3?: (res: http.IncomingMessage) => void
      ): http.ClientRequest => {
        // Parse polymorphic arguments into standardized request variables
        const { urlObj, options, callback } = parseHttpArguments(
          moduleProtocol,
          arg1,
          arg2,
          arg3
        );

        const rewrittenStr = this.routingTable.resolve(urlObj.toString());
        if (rewrittenStr) {
          const rewritten = new URL(rewrittenStr);

          // 1. Route to local digital twin emulator target
          let newOptions = rewriteRequestOptions(options, rewritten);

          // 2. Add verification header to store original destination
          newOptions = injectOriginalHostHeader(newOptions, urlObj.host);

          const targetRequest =
            rewritten.protocol === 'https:'
              ? this.originalHttpsRequest
              : this.originalHttpRequest;
          if (!targetRequest) {
            throw new Error(
              'NodeInterceptor: Cannot call targetRequest because the interceptor has not been fully installed.'
            );
          }
          return callRequestWithOptions(targetRequest, newOptions, callback);
        }

        // Pass-through to original network endpoint if no matching redirection rule is found
        return forwardToOriginalRequest(originalRequest, arg1, arg2, callback);
      };
    };

    // Helper to generate a patched get method (wraps the request method and auto-ends the request stream)
    const createPatchedGet = (patchedRequest: typeof http.request) => {
      return (
        arg1: string | URL | http.RequestOptions,
        arg2?: http.RequestOptions | ((res: http.IncomingMessage) => void),
        arg3?: (res: http.IncomingMessage) => void
      ): http.ClientRequest => {
        let req: http.ClientRequest;
        if (typeof arg1 === 'string' || arg1 instanceof URL) {
          if (typeof arg2 === 'object' && arg2 !== null) {
            req = callRequestWithUrlAndOptions(
              patchedRequest,
              arg1,
              arg2,
              arg3
            );
          } else {
            const callback = typeof arg2 === 'function' ? arg2 : arg3;
            req = callRequestWithUrl(patchedRequest, arg1, callback);
          }
        } else {
          const callback = typeof arg2 === 'function' ? arg2 : arg3;
          req = callRequestWithOptions(patchedRequest, arg1, callback);
        }
        req.end();
        return req;
      };
    };

    http.request = createPatchedRequest(
      'http:',
      this.originalHttpRequest
    ) as typeof http.request;
    https.request = createPatchedRequest(
      'https:',
      this.originalHttpsRequest as typeof http.request
    ) as typeof https.request;

    http.get = createPatchedGet(http.request) as typeof http.get;
    https.get = createPatchedGet(
      https.request as typeof http.request
    ) as typeof https.get;
  }

  /**
   * Restores global fetch to its original implementation.
   */
  private restoreFetch(): void {
    if (this.originalFetch) {
      globalThis.fetch = this.originalFetch;
      this.originalFetch = null;
    }
  }

  /**
   * Restores Node's http/https methods to their original implementations.
   */
  private restoreHttpAndHttpsRequests(): void {
    if (this.originalHttpRequest) {
      http.request = this.originalHttpRequest;
      this.originalHttpRequest = null;
    }

    if (this.originalHttpGet) {
      http.get = this.originalHttpGet;
      this.originalHttpGet = null;
    }

    if (this.originalHttpsRequest) {
      https.request = this.originalHttpsRequest;
      this.originalHttpsRequest = null;
    }

    if (this.originalHttpsGet) {
      https.get = this.originalHttpsGet;
      this.originalHttpsGet = null;
    }
  }
}
