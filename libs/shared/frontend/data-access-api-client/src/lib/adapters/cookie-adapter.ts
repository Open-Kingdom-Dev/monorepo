import type { AuthAdapter } from './adapters.types';

export interface CookieAdapterConfig {
  cookieName?: string;
}

export function createCookieAdapter(config: CookieAdapterConfig = {}): AuthAdapter {
  const { cookieName = 'token' } = config;

  return {
    prepareHeaders(headers) {
      if (typeof document === 'undefined') return;

      const cookie = document.cookie
        .split('; ')
        .find((row) => row.startsWith(`${cookieName}=`));

      const token = cookie?.split('=')[1];

      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    },
  };
}

