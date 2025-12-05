import type { AuthAdapter } from './adapters.types';

export interface CustomHeaderAdapterConfig {
  headerName: string;
  formatValue?: (token: string) => string;
}

export function createCustomHeaderAdapter(
  config: CustomHeaderAdapterConfig
): AuthAdapter {
  return {
    prepareHeaders(headers, token) {
      const value = config.formatValue ? config.formatValue(token) : token;
      headers.set(config.headerName, value);
    },
  };
}
