import {
  authReducer,
  setToken,
  logout,
  selectToken,
  selectIsAuthenticated,
  getAuthAdapter,
  setAuthAdapter,
  AuthKey,
} from './auth.slice.js';
import type { AuthAdapter } from './adapters/adapters.types.js';

describe('Auth Slice', () => {
  describe('reducer', () => {
    it('starts with no token', () => {
      const state = authReducer(undefined, { type: 'unknown' });
      expect(state).toEqual({ token: null });
    });

    it('stores a new token', () => {
      const state = authReducer({ token: null }, setToken('test-token'));
      expect(state.token).toBe('test-token');
    });

    it('clears the token on logout', () => {
      const state = authReducer({ token: 'existing-token' }, logout());
      expect(state.token).toBeNull();
    });
  });

  describe('selectors', () => {
    it('retrieves the current token', () => {
      const state = { [AuthKey]: { token: 'my-token' } };
      expect(selectToken(state)).toBe('my-token');
    });

    it('confirms user is authenticated when token exists', () => {
      const state = { [AuthKey]: { token: 'my-token' } };
      expect(selectIsAuthenticated(state)).toBe(true);
    });

    it('confirms user is not authenticated without a token', () => {
      const state = { [AuthKey]: { token: null } };
      expect(selectIsAuthenticated(state)).toBe(false);
    });
  });

  describe('adapter', () => {
    afterEach(() => {
      setAuthAdapter(null);
    });

    it('returns null when no adapter set', () => {
      expect(getAuthAdapter()).toBeNull();
    });

    it('stores and retrieves adapter', () => {
      const adapter: AuthAdapter = { prepareHeaders: jest.fn() };
      setAuthAdapter(adapter);
      expect(getAuthAdapter()).toBe(adapter);
    });
  });
});
