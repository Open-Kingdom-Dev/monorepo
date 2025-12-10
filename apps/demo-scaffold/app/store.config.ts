import { createRootStore } from '@open-kingdom/demo-scaffold-frontend-feature-root-store';
import {
  configureAuth,
  storagePersistence,
} from '@open-kingdom/shared-frontend-data-access-api-client';

// Configure auth before store creation
configureAuth({
  persistence: storagePersistence(localStorage),
});

export function createAppStore() {
  return createRootStore();
}
