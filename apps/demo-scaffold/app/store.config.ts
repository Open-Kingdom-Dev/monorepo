import { createRootStore } from '@open-kingdom/demo-scaffold-frontend-feature-root-store';
import type { LoggerConfig } from '@open-kingdom/shared-frontend-data-access-logger';
import {
  configureAuth,
  storagePersistence,
} from '@open-kingdom/shared-frontend-data-access-api-client';

// Configure auth before store creation
configureAuth({
  persistence: storagePersistence(localStorage),
});

export function createAppStore() {
  const config: LoggerConfig = {
    destination: 'console',
  };

  return createRootStore(config);
}

/**
 * Get the logger configuration for the application
 */
export function getLoggerConfig(): LoggerConfig {
  return {
    destination: 'console',
  };
}
