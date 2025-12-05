import {
  createListenerMiddleware,
  isAnyOf,
  Middleware,
} from '@reduxjs/toolkit';
import { baseApi } from './baseApi';
import {
  AuthKey,
  AuthState,
  setToken,
  logout,
  AuthPersistence,
} from './auth.slice';

interface AuthConfig {
  persistence?: AuthPersistence;
  onLogout?: () => void;
}

let authConfig: AuthConfig = {};

export function configureAuth(config: AuthConfig): void {
  authConfig = config;
}

export function createAuthListenerMiddleware() {
  const listener = createListenerMiddleware();

  listener.startListening({
    actionCreator: logout,
    effect: (_action, api) => {
      api.dispatch(baseApi.util.resetApiState());
      if (authConfig.onLogout) {
        authConfig.onLogout();
      }
    },
  });

  listener.startListening({
    matcher: isAnyOf(setToken, logout),
    effect: (_action, api) => {
      if (!authConfig.persistence) return;
      const state = api.getState() as { [AuthKey]: AuthState };
      authConfig.persistence.setToken(state[AuthKey].token);
    },
  });

  return listener.middleware;
}

export function createAuthHydrationMiddleware(): Middleware {
  let hydrated = false;
  return (store) => (next) => (action) => {
    if (!hydrated && authConfig.persistence) {
      hydrated = true;
      const token = authConfig.persistence.getToken();
      if (token) {
        store.dispatch(setToken(token));
      }
    }
    return next(action);
  };
}
