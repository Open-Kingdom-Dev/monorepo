import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AuthAdapter } from './adapters/adapters.types';

export const AuthKey = 'auth';

// Module-level adapter (not in Redux state - functions aren't serializable)
let authAdapter: AuthAdapter | null = null;

export function getAuthAdapter(): AuthAdapter | null {
  return authAdapter;
}

export function setAuthAdapter(adapter: AuthAdapter | null): void {
  authAdapter = adapter;
}

export interface AuthState {
  token: string | null;
}

export interface AuthPersistence {
  getToken: () => string | null;
  setToken: (token: string | null) => void;
}

const initialState: AuthState = {
  token: null,
};

export const authSlice = createSlice({
  name: AuthKey,
  initialState,
  reducers: {
    setToken: (state, action: PayloadAction<string | null>) => {
      state.token = action.payload;
    },
    logout: (state) => {
      state.token = null;
    },
  },
});

export const { setToken, logout } = authSlice.actions;
export const authReducer = authSlice.reducer;

// Selectors
type StateWithAuth = { [AuthKey]: AuthState };
export const selectToken = (state: StateWithAuth) => state[AuthKey].token;
export const selectIsAuthenticated = (state: StateWithAuth) =>
  !!state[AuthKey].token;
