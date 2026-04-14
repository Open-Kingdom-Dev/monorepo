/**
 * Routing rule for intercepting external HTTP requests.
 */
export interface RoutingRule {
  /**
   * The external domain or URL pattern to intercept.
   * Examples: 'storage.googleapis.com', 'https://api.example.com/v1'
   */
  from: string;

  /**
   * The local twin endpoint to route requests to.
   * Examples: 'http://localhost:9013', 'http://localhost:8080/api'
   */
  to: string;
}

/**
 * Configuration for the HTTP interceptor.
 */
export interface InterceptorConfig {
  /**
   * Whether the interceptor is enabled.
   * @default true
   */
  enabled: boolean;

  /**
   * Routing rules defining which external requests to intercept.
   */
  rules: RoutingRule[];

  /**
   * Whether to log intercepted requests to console.
   * @default false
   */
  verbose: boolean;
}

/**
 * Create an interceptor config with optional overrides.
 */
export function createInterceptorConfig(
  overrides?: Partial<InterceptorConfig>
): InterceptorConfig {
  return {
    enabled: true,
    verbose: false,
    rules: [],
    ...overrides,
  };
}
