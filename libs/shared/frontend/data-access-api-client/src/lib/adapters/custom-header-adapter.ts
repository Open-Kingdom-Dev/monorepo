import type { AuthAdapter } from './adapters.types';

export interface CustomHeaderAdapterConfig {
  headerName: string;
  getValue: () => string | null;
}

export function createCustomHeaderAdapter(config: CustomHeaderAdapterConfig): AuthAdapter {
  return {
    prepareHeaders(headers) {
      const value = config.getValue();
      if (value) {
        headers.set(config.headerName, value);
      }
    },
  };
}

