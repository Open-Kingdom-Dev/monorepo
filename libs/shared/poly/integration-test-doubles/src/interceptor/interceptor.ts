import {
  InterceptorConfig,
  createInterceptorConfig,
  RoutingRule,
} from './interceptor.config.js';
import { AgentInterceptor } from './interceptor.agents.js';

/**
 * HTTP request interceptor that reroutes external requests to local twins.
 *
 * Supports both fetch API and Node.js http/https agents.
 */
export class HttpInterceptor {
  private config: InterceptorConfig;
  private isInstalled = false;
  private originalFetch?: typeof globalThis.fetch;
  private agentInterceptor: AgentInterceptor;

  constructor(config?: Partial<InterceptorConfig>) {
    this.config = createInterceptorConfig(config);
    this.agentInterceptor = new AgentInterceptor();
  }

  /**
   * Install the interceptor by overriding global fetch and http/https agents.
   */
  async install(): Promise<void> {
    if (this.isInstalled) {
      this.log('Interceptor already installed');
      return;
    }

    if (!this.config.enabled) {
      this.log('Interceptor is disabled, skipping installation');
      return;
    }

    this.log('Installing HTTP interceptor...');

    // Store original implementations
    this.originalFetch = globalThis.fetch;

    // Install fetch interception
    this.installFetchInterception();

    // Install http/https agent interception
    this.installAgentInterception();

    this.isInstalled = true;
    this.log('HTTP interceptor installed');
  }

  /**
   * Uninstall the interceptor, restoring original implementations.
   */
  async uninstall(): Promise<void> {
    if (!this.isInstalled) {
      this.log('Interceptor not installed, skipping uninstall');
      return;
    }

    this.log('Uninstalling HTTP interceptor...');

    // Restore fetch
    if (this.originalFetch) {
      globalThis.fetch = this.originalFetch;
      this.originalFetch = undefined;
    }

    // Restore http/https agents
    this.uninstallAgentInterception();

    this.isInstalled = false;
    this.log('HTTP interceptor uninstalled');
  }

  /**
   * Check if the interceptor is currently installed.
   */
  isHealthy(): boolean {
    return this.isInstalled;
  }

  /**
   * Get the current configuration.
   */
  getConfig(): InterceptorConfig {
    return { ...this.config };
  }

  /**
   * Add a routing rule dynamically.
   */
  addRule(rule: RoutingRule): void {
    this.config.rules.push(rule);
    this.log(`Added routing rule: ${rule.from} → ${rule.to}`);
  }

  /**
   * Remove routing rules matching a predicate.
   */
  removeRules(predicate: (rule: RoutingRule) => boolean): void {
    const before = this.config.rules.length;
    this.config.rules = this.config.rules.filter((rule) => !predicate(rule));
    const removed = before - this.config.rules.length;
    this.log(`Removed ${removed} routing rule(s)`);
  }

  /**
   * Clear all routing rules.
   */
  clearRules(): void {
    this.config.rules = [];
    this.log('Cleared all routing rules');
  }

  /**
   * Check if a URL should be intercepted.
   */
  private shouldIntercept(url: string): string | null {
    try {
      const parsedUrl = new URL(url);

      for (const rule of this.config.rules) {
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
   * Install fetch interception.
   */
  private installFetchInterception(): void {
    const originalFetch = this.originalFetch || globalThis.fetch;

    globalThis.fetch = (
      input: Parameters<typeof globalThis.fetch>[0],
      init?: Parameters<typeof globalThis.fetch>[1]
    ): ReturnType<typeof globalThis.fetch> => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
          ? input.toString()
          : input.url;
      const rewrittenUrl = this.shouldIntercept(url);

      if (rewrittenUrl) {
        this.log(`[fetch] Intercepted: ${url} → ${rewrittenUrl}`);

        // Create new request with rewritten URL
        const newInput =
          typeof input === 'string'
            ? rewrittenUrl
            : input instanceof URL
            ? new URL(rewrittenUrl)
            : { ...input, url: rewrittenUrl };

        return originalFetch(newInput, init);
      }

      return originalFetch(input, init);
    };
  }

  /**
   * Install http/https agent interception.
   */
  private installAgentInterception(): void {
    this.agentInterceptor.setRules(this.config.rules);
    this.agentInterceptor.setVerbose(this.config.verbose);
    this.agentInterceptor.install();
  }

  /**
   * Uninstall http/https agent interception.
   */
  private uninstallAgentInterception(): void {
    this.agentInterceptor.uninstall();
  }

  /**
   * Log a message if verbose mode is enabled.
   */
  private log(message: string): void {
    if (this.config.verbose) {
      console.log(`[HttpInterceptor] ${message}`);
    }
  }
}

// Type alias for routing rules
export type { RoutingRule };
