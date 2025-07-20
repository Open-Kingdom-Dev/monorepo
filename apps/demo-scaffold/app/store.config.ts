import { createRootStore } from '@ynaa/demo-scaffold-feature-root-store';
import type { LoggerConfig } from '@ynaa/shared-data-access-logger';

/**
 * Application store configuration
 * This encapsulates the business logic for how our store should be configured
 */
export function createAppStore() {
  const config: LoggerConfig = {
    destination: 'console'
  };
  
  return createRootStore(config);
}

/**
 * Get the logger configuration for the application
 * This allows us to test and modify logging behavior
 */
export function getLoggerConfig(): LoggerConfig {
  return {
    destination: 'console'
  };
}
