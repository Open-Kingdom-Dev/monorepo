import { configureStore } from '@reduxjs/toolkit';
import { authReducer, setToken, logout, AuthKey } from './auth.slice.js';
import { baseApi } from './baseApi.js';
import {
  configureAuth,
  createAuthListenerMiddleware,
  createAuthHydrationMiddleware,
} from './auth.listener.js';

describe('Auth Listener', () => {
  const createTestStore = () =>
    configureStore({
      reducer: {
        [AuthKey]: authReducer,
        [baseApi.reducerPath]: baseApi.reducer,
      },
      middleware: (getDefault) =>
        getDefault()
          .concat(baseApi.middleware)
          .concat(createAuthListenerMiddleware())
          .prepend(createAuthHydrationMiddleware()),
    });

  beforeEach(() => {
    configureAuth({});
  });

  it('hydrates token from persistence on first action', () => {
    const persistence = {
      getToken: jest.fn().mockReturnValue('persisted-token'),
      setToken: jest.fn(),
    };
    configureAuth({ persistence });

    const store = createTestStore();
    store.dispatch({ type: 'init' });

    expect(store.getState()[AuthKey].token).toBe('persisted-token');
  });

  it('persists token changes', () => {
    const persistence = {
      getToken: jest.fn().mockReturnValue(null),
      setToken: jest.fn(),
    };
    configureAuth({ persistence });

    const store = createTestStore();
    store.dispatch(setToken('new-token'));
    store.dispatch(logout());

    expect(persistence.setToken).toHaveBeenCalledWith('new-token');
    expect(persistence.setToken).toHaveBeenLastCalledWith(null);
  });

  it('calls onLogout callback on logout', () => {
    const onLogout = jest.fn();
    configureAuth({ onLogout });

    const store = createTestStore();
    store.dispatch(logout());

    expect(onLogout).toHaveBeenCalled();
  });
});
