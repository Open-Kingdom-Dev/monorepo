import { createRootStore } from '@open-kingdom/demo-scaffold-frontend-feature-root-store';
import type { LoggerConfig } from '@open-kingdom/shared-frontend-data-access-logger';

/**
 * Application store configuration
 * This encapsulates the business logic for how our store should be configured
 */
export function createAppStore() {
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
