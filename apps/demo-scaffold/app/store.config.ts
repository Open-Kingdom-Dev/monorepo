import { createRootStore } from '@open-kingdom/demo-scaffold-frontend-feature-root-store';
import type { LoggerConfig } from '@open-kingdom/shared-frontend-data-access-logger';
import { configureApiClient,  createJwtAdapter } from '@open-kingdom/shared-frontend-data-access-api-client';

/**
 * Application store configuration
 * This encapsulates the business logic for how our store should be configured
 */
export function createAppStore() {
  configureApiClient({
    /* Using JWT adapter for authentication
     - This adapter is used to get the token from the JWT
     - The token is stored in the localStorage
     */
    authAdapter: createJwtAdapter({
      getToken: () => {
        if (typeof window === 'undefined') return null;
        try {
          return window.localStorage.getItem('token');
        } catch {
          return null;
        }
      },
    }),
      /* Using custom header adapter for authentication
       - This adapter is used to get the token from the custom header 
       - The header name is 'X-API-KEY' and the value is '1234567890'
       */
    // authAdapter: createCustomHeaderAdapter({
    //   headerName: 'X-API-KEY',
    //   getValue: () => {
    //     return '1234567890';
    //   },
    // }),
    /* Using cookie adapter for authentication
    - This adapter is used to get the token from the cookie
    */
    // authAdapter: createCookieAdapter({
    //   cookieName: 'token',
    // }),
  });

  const config: LoggerConfig = {
    destination: 'console',
  };

  return createRootStore(config);
}

/**
 * Get the logger configuration for the application
 * This allows us to test and modify logging behavior
 */
export function getLoggerConfig(): LoggerConfig {
  return {
    destination: 'console',
  };
}
