import http from 'http';
import https from 'https';
import { RoutingRule } from './interceptor.config.js';

/**
 * Extended RequestOptions that includes the `href` property.
 * Node.js internally populates `href` on parsed URL options,
 * but the official `@types/node` `ClientRequestArgs` doesn't declare it.
 */
interface RequestOptionsWithHref extends http.RequestOptions {
  href?: string;
}

/**
 * Mutable view of the http/https module for monkey-patching.
 * Avoids casting to `any` when reassigning `get` and `request`.
 */
interface MutableHttpModule {
  get: typeof http.get;
  request: typeof http.request;
}

/**
 * HTTP/HTTPS agent interceptor that reroutes requests to local twins.
 */
export class AgentInterceptor {
  private rules: RoutingRule[] = [];
  private originalHttpGet?: typeof http.get;
  private originalHttpRequest?: typeof http.request;
  private originalHttpsGet?: typeof https.get;
  private originalHttpsRequest?: typeof https.request;
  private verbose = false;

  /**
   * Set routing rules for the agent interceptor.
   */
  setRules(rules: RoutingRule[]): void {
    this.rules = rules;
  }

  /**
   * Set verbose logging.
   */
  setVerbose(verbose: boolean): void {
    this.verbose = verbose;
  }

  /**
   * Install agent interception by wrapping http/https methods.
   */
  install(): void {
    this.log('Installing HTTP/HTTPS agent interception...');

    // Store originals
    this.originalHttpGet = http.get;
    this.originalHttpRequest = http.request;
    this.originalHttpsGet = https.get;
    this.originalHttpsRequest = https.request;

    // Monkey-patch via a mutable view of the module
    const mutableHttp = http as unknown as MutableHttpModule;
    const mutableHttps = https as unknown as MutableHttpModule;

    mutableHttp.get = this.wrapGet(http.get);
    mutableHttp.request = this.wrapRequest(http.request);
    mutableHttps.get = this.wrapGet(https.get);
    mutableHttps.request = this.wrapRequest(https.request);

    this.log('HTTP/HTTPS agent interception installed');
  }

  /**
   * Uninstall agent interception, restoring originals.
   */
  uninstall(): void {
    this.log('Uninstalling HTTP/HTTPS agent interception...');

    if (this.originalHttpGet) http.get = this.originalHttpGet;
    if (this.originalHttpRequest) http.request = this.originalHttpRequest;
    if (this.originalHttpsGet) https.get = this.originalHttpsGet;
    if (this.originalHttpsRequest) https.request = this.originalHttpsRequest;

    this.log('HTTP/HTTPS agent interception uninstalled');
  }

  /**
   * Wrap http.get to intercept URLs.
   */
  private wrapGet(originalGet: typeof http.get): typeof http.get {
    return (
      urlOrOptions: string | URL | http.RequestOptions,
      optionsOrCallback?:
        | http.RequestOptions
        | ((res: http.IncomingMessage) => void),
      callback?: (res: http.IncomingMessage) => void
    ): http.ClientRequest => {
      return this.dispatchIntercepted(
        originalGet,
        'http.get',
        urlOrOptions,
        optionsOrCallback,
        callback
      );
    };
  }

  /**
   * Wrap http.request to intercept URLs.
   */
  private wrapRequest(
    originalRequest: typeof http.request
  ): typeof http.request {
    return (
      urlOrOptions: string | URL | http.RequestOptions,
      optionsOrCallback?:
        | http.RequestOptions
        | ((res: http.IncomingMessage) => void),
      callback?: (res: http.IncomingMessage) => void
    ): http.ClientRequest => {
      return this.dispatchIntercepted(
        originalRequest,
        'http.request',
        urlOrOptions,
        optionsOrCallback,
        callback
      );
    };
  }

  /**
   * Core dispatch logic shared by wrapGet and wrapRequest.
   * Uses type narrowing to call the correct Node overload.
   */
  private dispatchIntercepted(
    originalFn: typeof http.get,
    label: string,
    urlOrOptions: string | URL | http.RequestOptions,
    optionsOrCallback?:
      | http.RequestOptions
      | ((res: http.IncomingMessage) => void),
    callback?: (res: http.IncomingMessage) => void
  ): http.ClientRequest {
    const rewritten = this.rewriteIfMatched(urlOrOptions);

    if (rewritten) {
      this.log(
        `[${label}] Intercepted: ${this.urlToString(
          urlOrOptions
        )} → ${this.urlToString(rewritten)}`
      );
      return this.callOriginal(
        originalFn,
        rewritten,
        optionsOrCallback,
        callback
      );
    }

    return this.callOriginal(
      originalFn,
      urlOrOptions,
      optionsOrCallback,
      callback
    );
  }

  /**
   * Call the original http function, forwarding all three positional args
   * to preserve the exact call signature for intercepted and passthrough calls.
   *
   * We use a generic function type to bypass overload resolution — Node's
   * http.get/request internally handle all argument combinations regardless
   * of which TypeScript overload signature was matched at compile time.
   */
  private callOriginal(
    fn: typeof http.get,
    urlOrOptions: string | URL | http.RequestOptions,
    optionsOrCallback?:
      | http.RequestOptions
      | ((res: http.IncomingMessage) => void),
    callback?: (res: http.IncomingMessage) => void
  ): http.ClientRequest {
    // Use a single-signature type that accepts all three positional args.
    // This is type-safe: every value we pass is a valid member of the union
    // that Node's implementation accepts at runtime.
    type HttpFn = (
      urlOrOpts: string | URL | http.RequestOptions,
      optsOrCb?: http.RequestOptions | ((res: http.IncomingMessage) => void),
      cb?: (res: http.IncomingMessage) => void
    ) => http.ClientRequest;

    return (fn as HttpFn)(urlOrOptions, optionsOrCallback, callback);
  }

  /**
   * Rewrite URL if it matches a routing rule.
   */
  private rewriteIfMatched(
    url: string | URL | http.RequestOptions
  ): string | URL | http.RequestOptions | null {
    // Extract URL string from various input types
    const urlString = this.extractUrlString(url);
    if (!urlString) return null;

    // Check against rules
    const rewritten = this.shouldIntercept(urlString);
    if (rewritten) {
      // Return appropriate type based on input
      if (url instanceof URL) {
        return new URL(rewritten);
      }
      if (typeof url === 'string') {
        return rewritten;
      }
      // For RequestOptions, update the object
      return this.rewriteRequestOptions(url, rewritten);
    }

    return null;
  }

  /**
   * Extract a URL string from various input types.
   */
  private extractUrlString(
    url: string | URL | http.RequestOptions
  ): string | null {
    if (typeof url === 'string') return url;
    if (url instanceof URL) return url.toString();

    // RequestOptions — check for href first (populated by Node internally)
    const opts = url as RequestOptionsWithHref;
    if (typeof opts.href === 'string') return opts.href;

    // Reconstruct from hostname + path
    if (typeof opts.hostname === 'string' && typeof opts.path === 'string') {
      const protocol = opts.protocol || 'http:';
      const port = opts.port ? `:${opts.port}` : '';
      return `${protocol}//${opts.hostname}${port}${opts.path}`;
    }

    return null;
  }

  /**
   * Rewrite a RequestOptions object in-place with a new target URL.
   */
  private rewriteRequestOptions(
    opts: http.RequestOptions,
    rewrittenUrl: string
  ): http.RequestOptions {
    const newUrl = new URL(rewrittenUrl);
    const mutableOpts = opts as RequestOptionsWithHref;
    mutableOpts.protocol = newUrl.protocol;
    mutableOpts.hostname = newUrl.hostname;
    mutableOpts.port = newUrl.port || undefined;
    mutableOpts.path = newUrl.pathname + newUrl.search;
    mutableOpts.href = rewrittenUrl;
    return mutableOpts;
  }

  /**
   * Check if a URL should be intercepted.
   */
  private shouldIntercept(url: string): string | null {
    try {
      const parsedUrl = new URL(url);

      for (const rule of this.rules) {
        const fromUrl = new URL(rule.from);

        // Check if the hostname matches
        if (parsedUrl.hostname === fromUrl.hostname) {
          // Check if the path matches (if specified in the rule)
          if (fromUrl.pathname && fromUrl.pathname !== '/') {
            if (parsedUrl.pathname.startsWith(fromUrl.pathname)) {
              return this.rewriteUrl(rule, parsedUrl);
            }
          } else {
            // Hostname-only match
            return this.rewriteUrl(rule, parsedUrl);
          }
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Rewrite a URL according to a routing rule.
   */
  private rewriteUrl(rule: RoutingRule, originalUrl: URL): string {
    const fromUrl = new URL(rule.from);
    const toUrl = new URL(rule.to);

    // If the rule has a specific path, replace the matched prefix with target path
    if (fromUrl.pathname && fromUrl.pathname !== '/') {
      // Remove the matched prefix from original path
      const remainingPath = originalUrl.pathname.slice(fromUrl.pathname.length);
      // Combine target path with remaining original path
      const newPath =
        toUrl.pathname === '/'
          ? remainingPath || '/'
          : toUrl.pathname + remainingPath;
      return toUrl.origin + newPath + originalUrl.search;
    }

    // Otherwise just change the origin, preserve full path
    return toUrl.origin + originalUrl.pathname + originalUrl.search;
  }

  /**
   * Convert URL input to string for logging.
   */
  private urlToString(url: string | URL | http.RequestOptions): string {
    if (typeof url === 'string') return url;
    if (url instanceof URL) return url.toString();
    const opts = url as RequestOptionsWithHref;
    if (opts.href) return opts.href;
    const protocol = opts.protocol || 'http:';
    const port = opts.port ? `:${opts.port}` : '';
    return `${protocol}//${opts.hostname}${port}${opts.path || ''}`;
  }

  /**
   * Log a message if verbose mode is enabled.
   */
  private log(message: string): void {
    if (this.verbose) {
      console.log(`[AgentInterceptor] ${message}`);
    }
  }
}
