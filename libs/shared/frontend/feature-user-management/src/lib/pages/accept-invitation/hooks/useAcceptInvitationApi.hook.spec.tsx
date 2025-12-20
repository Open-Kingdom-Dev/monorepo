import { renderHook, act } from '@testing-library/react';
import { useAcceptInvitationApi } from './useAcceptInvitationApi.hook';

describe('useAcceptInvitationApi', () => {
  const mockAcceptMutation = jest.fn();
  let mockMutationResult: { data?: unknown; error?: unknown };

  const createMockApi = () => ({
    useAcceptInvitationMutation: () => [
      (...args: unknown[]) => {
        mockAcceptMutation(...args);
        return Promise.resolve(mockMutationResult);
      },
      { isLoading: false },
    ],
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockMutationResult = { data: { success: true } };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates an account with the provided password', async () => {
    const { result } = renderHook(() =>
      useAcceptInvitationApi({
        injectedApi: createMockApi() as never,
        token: 'valid-token',
      })
    );

    await act(async () => {
      await result.current.acceptInvitation({
        password: 'SecurePassword123',
        confirmPassword: 'SecurePassword123',
      });
    });

    expect(mockAcceptMutation).toHaveBeenCalledWith({
      token: 'valid-token',
      password: 'SecurePassword123',
      firstName: undefined,
      lastName: undefined,
    });
  });

  it('includes name when provided', async () => {
    const { result } = renderHook(() =>
      useAcceptInvitationApi({
        injectedApi: createMockApi() as never,
        token: 'valid-token',
      })
    );

    await act(async () => {
      await result.current.acceptInvitation({
        password: 'SecurePassword123',
        confirmPassword: 'SecurePassword123',
        firstName: 'John',
        lastName: 'Doe',
      });
    });

    expect(mockAcceptMutation).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: 'John',
        lastName: 'Doe',
      })
    );
  });

  it('trims whitespace from names', async () => {
    const { result } = renderHook(() =>
      useAcceptInvitationApi({
        injectedApi: createMockApi() as never,
        token: 'valid-token',
      })
    );

    await act(async () => {
      await result.current.acceptInvitation({
        password: 'SecurePassword123',
        confirmPassword: 'SecurePassword123',
        firstName: '  John  ',
        lastName: '  Doe  ',
      });
    });

    expect(mockAcceptMutation).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: 'John',
        lastName: 'Doe',
      })
    );
  });

  it('treats empty strings as undefined for names', async () => {
    const { result } = renderHook(() =>
      useAcceptInvitationApi({
        injectedApi: createMockApi() as never,
        token: 'valid-token',
      })
    );

    await act(async () => {
      await result.current.acceptInvitation({
        password: 'SecurePassword123',
        confirmPassword: 'SecurePassword123',
        firstName: '',
        lastName: '   ',
      });
    });

    expect(mockAcceptMutation).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: undefined,
        lastName: undefined,
      })
    );
  });

  it('marks success after account creation', async () => {
    const { result } = renderHook(() =>
      useAcceptInvitationApi({
        injectedApi: createMockApi() as never,
        token: 'valid-token',
      })
    );

    expect(result.current.success).toBe(false);

    await act(async () => {
      await result.current.acceptInvitation({
        password: 'SecurePassword123',
        confirmPassword: 'SecurePassword123',
      });
    });

    expect(result.current.success).toBe(true);
  });

  it('shows success notification when callback is provided', async () => {
    const onNotify = jest.fn();

    const { result } = renderHook(() =>
      useAcceptInvitationApi({
        injectedApi: createMockApi() as never,
        token: 'valid-token',
        onNotify,
      })
    );

    await act(async () => {
      await result.current.acceptInvitation({
        password: 'SecurePassword123',
        confirmPassword: 'SecurePassword123',
      });
    });

    expect(onNotify).toHaveBeenCalledWith(
      'success',
      'Account activated successfully!'
    );
  });

  it('calls custom success callback when provided', async () => {
    const onSuccess = jest.fn();

    const { result } = renderHook(() =>
      useAcceptInvitationApi({
        injectedApi: createMockApi() as never,
        token: 'valid-token',
        onSuccess,
      })
    );

    await act(async () => {
      await result.current.acceptInvitation({
        password: 'SecurePassword123',
        confirmPassword: 'SecurePassword123',
      });
    });

    expect(onSuccess).toHaveBeenCalled();
  });

  it('redirects to login page after successful activation', async () => {
    const onNavigate = jest.fn();

    const { result } = renderHook(() =>
      useAcceptInvitationApi({
        injectedApi: createMockApi() as never,
        token: 'valid-token',
        onNavigate,
      })
    );

    await act(async () => {
      await result.current.acceptInvitation({
        password: 'SecurePassword123',
        confirmPassword: 'SecurePassword123',
      });
    });

    // Fast-forward past the redirect timeout
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(onNavigate).toHaveBeenCalledWith('/login');
  });

  it('uses custom login URL when provided', async () => {
    const onNavigate = jest.fn();

    const { result } = renderHook(() =>
      useAcceptInvitationApi({
        injectedApi: createMockApi() as never,
        token: 'valid-token',
        loginUrl: '/auth/signin',
        onNavigate,
      })
    );

    await act(async () => {
      await result.current.acceptInvitation({
        password: 'SecurePassword123',
        confirmPassword: 'SecurePassword123',
      });
    });

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(onNavigate).toHaveBeenCalledWith('/auth/signin');
  });

  it('shows error notification when activation fails', async () => {
    mockMutationResult = { error: { data: { message: 'Token expired' } } };
    const onNotify = jest.fn();

    const { result } = renderHook(() =>
      useAcceptInvitationApi({
        injectedApi: createMockApi() as never,
        token: 'expired-token',
        onNotify,
      })
    );

    await act(async () => {
      await result.current.acceptInvitation({
        password: 'SecurePassword123',
        confirmPassword: 'SecurePassword123',
      });
    });

    expect(onNotify).toHaveBeenCalledWith('error', 'Token expired');
  });

  it('shows default error message when no message in response', async () => {
    mockMutationResult = { error: new Error('Network error') };
    const onNotify = jest.fn();

    const { result } = renderHook(() =>
      useAcceptInvitationApi({
        injectedApi: createMockApi() as never,
        token: 'valid-token',
        onNotify,
      })
    );

    await act(async () => {
      await result.current.acceptInvitation({
        password: 'SecurePassword123',
        confirmPassword: 'SecurePassword123',
      });
    });

    expect(onNotify).toHaveBeenCalledWith(
      'error',
      'Failed to activate account'
    );
  });

  it('does not mark success when activation fails', async () => {
    mockMutationResult = { error: new Error('Failed') };

    const { result } = renderHook(() =>
      useAcceptInvitationApi({
        injectedApi: createMockApi() as never,
        token: 'valid-token',
      })
    );

    await act(async () => {
      await result.current.acceptInvitation({
        password: 'SecurePassword123',
        confirmPassword: 'SecurePassword123',
      });
    });

    expect(result.current.success).toBe(false);
  });
});
