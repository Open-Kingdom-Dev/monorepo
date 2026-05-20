import { RoutingTable } from './routing-table.js';

export class NodeInterceptor {
  private originalFetch: typeof globalThis.fetch | null = null;
  private readonly routingTable: RoutingTable;
  private active = false;

  constructor(routingTable: RoutingTable) {
    this.routingTable = routingTable;
  }

  install(): void {
    if (this.active || this.originalFetch) {
      return; // Idempotency guard
    }

    this.originalFetch = globalThis.fetch;
    this.active = true;

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

        // 3. Inject X-Original-Host
        headers.set('X-Original-Host', originalHost);

        // Handle native Request object conversion cleanly
        if (input instanceof Request) {
          // If a Request object is passed, build new RequestInit from it
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

  uninstall(): void {
    if (!this.active || !this.originalFetch) {
      return;
    }
    globalThis.fetch = this.originalFetch;
    this.originalFetch = null;
    this.active = false;
  }

  isActive(): boolean {
    return this.active;
  }
}
