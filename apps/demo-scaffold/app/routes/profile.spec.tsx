import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import {
  configureStore,
  type Middleware,
  type Reducer,
  type EnhancedStore,
  type UnknownAction,
} from '@reduxjs/toolkit';
import type { Action } from '@reduxjs/toolkit';
import {
  LoggerKey,
  loggerReducer,
  createConsoleLoggerMiddleware,
} from '@open-kingdom/shared-frontend-data-access-logger';
import {
  NotificationKey,
  notificationReducer,
} from '@open-kingdom/shared-frontend-data-access-notifications';
import {
  baseApi,
  AuthKey,
  authReducer,
  setToken,
} from '@open-kingdom/shared-frontend-data-access-api-client';
import Profile from './profile';

jest.mock('@open-kingdom/shared-frontend-data-access-api-client', () => {
  const identityMiddleware: Middleware = () => (next) => (action) =>
    next(action);
  const mockReducer: Reducer<unknown, Action> = (state = {}) => state;
  const loginMock = jest.fn();
  const profileMock = jest.fn();

  // Auth slice exports
  const AuthKey = 'auth';
  const selectIsAuthenticated = (state: {
    [AuthKey]?: { token: string | null };
  }) => !!(state[AuthKey] && state[AuthKey].token);
  const setToken = (token: string | null) => ({
    type: `${AuthKey}/setToken`,
    payload: token,
  });
  const logout = () => ({ type: `${AuthKey}/logout` });
  const authReducer = (
    state: { token: string | null } = { token: null },
    action: { type: string; payload?: string | null }
  ) => {
    if (action.type === `${AuthKey}/setToken`) {
      return { ...state, token: action.payload ?? null };
    }
    if (action.type === `${AuthKey}/logout`) {
      return { ...state, token: null };
    }
    return state;
  };

  return {
    baseApi: {
      reducerPath: 'api',
      reducer: mockReducer,
      middleware: identityMiddleware,
    },
    useAuthControllerLoginMutation: loginMock,
    useAuthControllerGetProfileQuery: profileMock,
    // Auth slice exports
    AuthKey,
    authReducer,
    selectIsAuthenticated,
    setToken,
    logout,
    __mockedHooks: {
      loginMock,
      profileMock,
    },
  };
});

const { __mockedHooks } = jest.requireMock(
  '@open-kingdom/shared-frontend-data-access-api-client'
) as {
  __mockedHooks: {
    loginMock: ReturnType<typeof jest.fn>;
    profileMock: ReturnType<typeof jest.fn>;
  };
};
const mockLoginHook = __mockedHooks.loginMock;
const mockProfileHook = __mockedHooks.profileMock;

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

interface TestState {
  auth: { token: string | null };
  [key: string]: unknown;
}

describe('Profile Component', () => {
  let store: EnhancedStore<TestState, UnknownAction>;

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();

    type MockApi = {
      reducerPath: string;
      reducer: Reducer<unknown, Action>;
      middleware: Middleware;
    };
    const api = baseApi as unknown as MockApi;

    store = configureStore({
      reducer: {
        [LoggerKey]: loggerReducer,
        [NotificationKey]: notificationReducer,
        [AuthKey]: authReducer,
        [api.reducerPath]: api.reducer,
      } as Parameters<typeof configureStore>[0]['reducer'],
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware()
          .concat(createConsoleLoggerMiddleware())
          .concat(api.middleware),
    }) as unknown as EnhancedStore<TestState, UnknownAction>;

    const defaultTrigger = jest.fn().mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({}),
    });
    mockLoginHook.mockReturnValue([
      defaultTrigger,
      { isLoading: false, error: null },
    ]);

    mockProfileHook.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });
  });

  const renderProfile = (options?: { token?: string }) => {
    if (options && options.token) {
      store.dispatch(setToken(options.token));
    }
    return render(
      <Provider store={store}>
        <Profile />
      </Provider>
    );
  };

  it('should render successfully', () => {
    renderProfile();
    expect(screen.getByRole('heading', { name: 'Login' })).toBeTruthy();
  });

  it('should show login form when not logged in', () => {
    renderProfile();
    expect(screen.getByLabelText('Email')).toBeTruthy();
    expect(screen.getByLabelText('Password')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Login' })).toBeTruthy();
  });

  it('submits login form and shows profile data on success', async () => {
    const unwrap = jest.fn().mockResolvedValue({ access_token: 'token-123' });
    const loginTrigger = jest.fn().mockReturnValue({ unwrap });
    mockLoginHook.mockReturnValue([
      loginTrigger,
      { isLoading: false, error: null },
    ]);

    mockProfileHook
      .mockReturnValueOnce({
        data: null,
        isLoading: false,
        error: null,
      })
      .mockReturnValue({
        data: {
          id: 1,
          email: 'user@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'admin',
        },
        isLoading: false,
        error: null,
      });

    renderProfile();

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'secret' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Profile' })).toBeTruthy()
    );

    expect(store.getState().auth.token).toBe('token-123');
    expect(screen.getByText('user@example.com')).toBeTruthy();
    expect(unwrap).toHaveBeenCalled();
  });

  it('shows loading state while logging in', () => {
    mockLoginHook.mockReturnValue([
      jest.fn(),
      { isLoading: true, error: null },
    ]);

    renderProfile();

    const button = screen.getByRole('button', { name: 'Logging in...' });
    expect(button).toBeTruthy();
    expect(button).toBeDisabled();
  });

  it('shows login error message', () => {
    mockLoginHook.mockReturnValue([
      jest.fn(),
      { isLoading: false, error: { status: 401 } },
    ]);

    renderProfile();
    expect(screen.getByText('Invalid credentials')).toBeTruthy();
  });

  it('renders profile loading state', () => {
    mockProfileHook.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    renderProfile({ token: 'test-token' });
    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  it('renders profile error state', () => {
    mockProfileHook.mockReturnValue({
      data: null,
      isLoading: false,
      error: { status: 500 },
    });

    renderProfile({ token: 'test-token' });
    expect(screen.getByText('Error loading profile')).toBeTruthy();
  });

  it('renders profile data and handles logout', () => {
    mockProfileHook.mockReturnValue({
      data: {
        id: 2,
        email: 'logout@example.com',
        firstName: 'Log',
        lastName: 'Out',
        role: 'user',
      },
      isLoading: false,
      error: null,
    });

    renderProfile({ token: 'test-token' });
    expect(screen.getByText('logout@example.com')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Logout' }));
    expect(store.getState().auth.token).toBeNull();
    expect(screen.getByRole('heading', { name: 'Login' })).toBeTruthy();
  });

  it('shows N/A when profile names are missing', () => {
    mockProfileHook.mockReturnValue({
      data: {
        id: 3,
        email: 'missing@example.com',
        firstName: null,
        lastName: null,
        role: 'guest',
      },
      isLoading: false,
      error: null,
    });

    renderProfile({ token: 'test-token' });
    const fallbackValues = screen.getAllByText('N/A');
    expect(fallbackValues.length).toBeGreaterThanOrEqual(2);
  });
});
