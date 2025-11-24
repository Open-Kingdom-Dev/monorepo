import type { AuthAdapter } from './adapters.types';

export interface JwtAdapterConfig {
  getToken: () => string | null;
}

export function createJwtAdapter(config: JwtAdapterConfig): AuthAdapter {
  return {
    prepareHeaders(headers) {
      const token = config.getToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    },
  };
}

