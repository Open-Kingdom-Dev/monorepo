/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import GoogleAuthDemo from './google-auth-demo';
import { useDispatch } from 'react-redux';
import {
  useGoogleAuthEmulateControllerGetStatusQuery,
  useGoogleAuthEmulateControllerStartMutation,
  useGoogleAuthEmulateControllerStopMutation,
  useGoogleAuthEmulateControllerResetMutation,
  useGoogleAuthEmulateControllerGetLoginUrlQuery,
  useGoogleAuthEmulateControllerGetLogsQuery,
  useGoogleAuthEmulateControllerGetLastResultQuery,
  useGoogleAuthEmulateControllerLogoutMutation,
} from '@open-kingdom/shared-frontend-data-access-api-client';

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
}));

jest.mock('@open-kingdom/shared-frontend-data-access-api-client', () => ({
  useGoogleAuthEmulateControllerGetStatusQuery: jest.fn(),
  useGoogleAuthEmulateControllerStartMutation: jest.fn(),
  useGoogleAuthEmulateControllerStopMutation: jest.fn(),
  useGoogleAuthEmulateControllerResetMutation: jest.fn(),
  useGoogleAuthEmulateControllerGetLoginUrlQuery: jest.fn(),
  useGoogleAuthEmulateControllerGetLogsQuery: jest.fn(),
  useGoogleAuthEmulateControllerGetLastResultQuery: jest.fn(),
  useGoogleAuthEmulateControllerLogoutMutation: jest.fn(),
}));

jest.mock('@open-kingdom/shared-frontend-data-access-notifications', () => ({
  showErrorNotification: jest.fn((msg) => ({ type: 'ERROR', msg })),
}));

jest.mock('@open-kingdom/shared-frontend-data-access-logger', () => ({
  logError: jest.fn((msg) => ({ type: 'LOG_ERROR', msg })),
}));

describe('GoogleAuthDemo Route Component', () => {
  let mockDispatch: jest.Mock;
  let mockStart: jest.Mock;
  let mockStop: jest.Mock;
  let mockReset: jest.Mock;
  let mockLogout: jest.Mock;
  let mockTriggerLoginUrl: jest.Mock;
  let mockRefetchStatus: jest.Mock;
  let mockRefetchLogsAndResult: jest.Mock;

  const onlineStatus = {
    running: true,
    healthy: true,
    port: 9015,
    url: 'http://localhost:9015',
  };
  const offlineStatus = {
    running: false,
    healthy: false,
    port: 9015,
  };

  const sampleLog = {
    id: 'log_1',
    timestamp: new Date().toISOString(),
    method: 'POST',
    url: 'http://localhost:9015/oauth2/token',
    statusCode: 200,
    requestHeaders: { 'Content-Type': 'application/x-www-form-urlencoded' },
    requestBody: 'code=123',
    responseHeaders: { 'content-type': 'application/json' },
    responseBody: '{"access_token":"abc"}',
    latencyMs: 10,
  };

  const sampleOAuthResult = {
    tokens: {
      access_token: 'test_access_token',
      id_token: 'test_id_token',
      refresh_token: 'test_refresh_token',
      expires_in: 3600,
      token_type: 'Bearer',
      scope: 'openid profile email',
    },
    userProfile: {
      sub: 'user_123',
      email: 'testuser@example.com',
      name: 'Test User',
      picture: 'https://example.com/pic.jpg',
      email_verified: true,
      hd: 'example.com',
    },
    apiLogs: [sampleLog],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockDispatch = jest.fn();
    (useDispatch as any).mockReturnValue(mockDispatch);

    mockStart = jest.fn().mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({ success: true }),
    });
    (useGoogleAuthEmulateControllerStartMutation as any).mockReturnValue([
      mockStart,
      { isLoading: false },
    ]);

    mockStop = jest.fn().mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({ success: true }),
    });
    (useGoogleAuthEmulateControllerStopMutation as any).mockReturnValue([
      mockStop,
      { isLoading: false },
    ]);

    mockReset = jest.fn().mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({ success: true }),
    });
    (useGoogleAuthEmulateControllerResetMutation as any).mockReturnValue([
      mockReset,
      { isLoading: false },
    ]);

    mockLogout = jest.fn().mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({ success: true }),
    });
    (useGoogleAuthEmulateControllerLogoutMutation as any).mockReturnValue([
      mockLogout,
      { isLoading: false },
    ]);

    mockTriggerLoginUrl = jest.fn().mockResolvedValue({
      data: { authUrl: 'http://localhost:9015/o/oauth2/v2/auth' },
    });
    (useGoogleAuthEmulateControllerGetLoginUrlQuery as any).mockReturnValue({
      refetch: mockTriggerLoginUrl,
      isFetching: false,
    });

    mockRefetchLogsAndResult = jest.fn();
    (useGoogleAuthEmulateControllerGetLastResultQuery as any).mockReturnValue({
      data: sampleOAuthResult,
      refetch: mockRefetchLogsAndResult,
    });
    (useGoogleAuthEmulateControllerGetLogsQuery as any).mockReturnValue({
      data: [sampleLog],
    });

    mockRefetchStatus = jest.fn();
    (useGoogleAuthEmulateControllerGetStatusQuery as any).mockReturnValue({
      data: onlineStatus,
      isLoading: false,
      refetch: mockRefetchStatus,
    });
  });

  const renderComponent = (initialEntries = ['/google-auth-demo']) =>
    render(
      <MemoryRouter initialEntries={initialEntries}>
        <GoogleAuthDemo />
      </MemoryRouter>
    );

  it('should render page header and authenticated components', async () => {
    renderComponent();
    expect(screen.getByText('Google Auth Emulator Demo')).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByText('Online (Port 9015)')).toBeTruthy();
      expect(screen.getByText('Test User')).toBeTruthy();
      expect(screen.getByText('testuser@example.com')).toBeTruthy();
      expect(screen.getByText('Issued OAuth Tokens')).toBeTruthy();
    });
  });

  it('should handle stop emulator button click', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Stop Emulator')).toBeTruthy();
    });

    fireEvent.click(screen.getByText('Stop Emulator'));

    await waitFor(() => {
      expect(mockStop).toHaveBeenCalled();
    });
  });

  it('should handle reset emulator button click', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Reset')).toBeTruthy();
    });

    fireEvent.click(screen.getByText('Reset'));

    await waitFor(() => {
      expect(mockReset).toHaveBeenCalled();
    });
  });

  it('should handle sign out button click', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Sign Out (Clear Session)')).toBeTruthy();
    });

    fireEvent.click(screen.getByText('Sign Out (Clear Session)'));

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });
  });

  it('should handle clear logs button click', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Clear Inspector')).toBeTruthy();
    });

    fireEvent.click(screen.getByText('Clear Inspector'));

    // Clear is a client-side no-op: logs remain in the RTK Query cache and
    // are refetched on the next status poll; persisted logs live server-side.
    await waitFor(() => {
      expect(screen.getByText('Clear Inspector')).toBeTruthy();
    });
    expect(screen.queryByText('No HTTP API calls captured yet.')).toBeNull();
    expect(screen.getByText('1 Logged Call')).toBeTruthy();
  });

  it('should toggle token visibility and raw JSON viewer', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Reveal Tokens')).toBeTruthy();
    });

    fireEvent.click(screen.getByText('Reveal Tokens'));
    expect(screen.getByText('Mask Values')).toBeTruthy();

    fireEvent.click(screen.getByText('Raw User Info Payload'));
    expect(screen.getByText('Copy JSON')).toBeTruthy();
  });

  it('should render offline status when emulator is not running', async () => {
    (useGoogleAuthEmulateControllerGetStatusQuery as any).mockReturnValue({
      data: offlineStatus,
      isLoading: false,
      refetch: mockRefetchStatus,
    });

    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Offline')).toBeTruthy();
      expect(screen.getByText('Start Emulator')).toBeTruthy();
    });
  });

  it('should render auth error banner when return query contains error', async () => {
    renderComponent(['/google-auth-demo?auth=error&message=FailedToAuth']);
    await waitFor(() => {
      expect(screen.getByText('OAuth Error Encountered')).toBeTruthy();
      expect(screen.getByText('FailedToAuth')).toBeTruthy();
    });
  });

  it('should dispatch error notification when starting emulator fails', async () => {
    mockStart.mockReturnValue({
      unwrap: jest.fn().mockRejectedValue(new Error('Docker timeout')),
    });

    (useGoogleAuthEmulateControllerGetStatusQuery as any).mockReturnValue({
      data: offlineStatus,
      isLoading: false,
      refetch: mockRefetchStatus,
    });

    renderComponent();
    const startBtn = screen.getByText('Start Emulator');
    await act(async () => {
      fireEvent.click(startBtn);
    });

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'LOG_ERROR',
          msg: 'Failed to start Google emulator: Docker timeout',
        })
      );
    });
  });

  it('should show no active session state when there is no OAuth result', async () => {
    (useGoogleAuthEmulateControllerGetLastResultQuery as any).mockReturnValue({
      data: null,
      refetch: mockRefetchLogsAndResult,
    });

    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('No Active Google Session')).toBeTruthy();
      expect(screen.getByText('Token Payload Inspection')).toBeTruthy();
      expect(screen.getByText('Mock OAuth Authorization')).toBeTruthy();
    });
  });

  it('should sign in by fetching the login URL and navigating to it', async () => {
    (useGoogleAuthEmulateControllerGetLastResultQuery as any).mockReturnValue({
      data: null,
      refetch: mockRefetchLogsAndResult,
    });

    renderComponent();

    const signInBtn = screen.getByText('Sign in with Google (Emulated)');
    await act(async () => {
      fireEvent.click(signInBtn);
    });

    await waitFor(() => {
      expect(mockTriggerLoginUrl).toHaveBeenCalled();
    });
  });

  it('should show emulator warning when emulator is offline', async () => {
    (useGoogleAuthEmulateControllerGetStatusQuery as any).mockReturnValue({
      data: offlineStatus,
      isLoading: false,
      refetch: mockRefetchStatus,
    });
    (useGoogleAuthEmulateControllerGetLastResultQuery as any).mockReturnValue({
      data: null,
      refetch: mockRefetchLogsAndResult,
    });

    renderComponent();
    await waitFor(() => {
      expect(
        screen.getByText(
          '⚠️ Start the emulator above before initiating Google sign-in.'
        )
      ).toBeTruthy();
      expect(screen.getByText('Sign in with Google (Emulated)')).toBeTruthy();
    });
  });

  it('should mask and reveal long vs short tokens correctly', async () => {
    (useGoogleAuthEmulateControllerGetLastResultQuery as any).mockReturnValue({
      data: {
        ...sampleOAuthResult,
        tokens: {
          access_token: 'short',
          id_token: 'abcdefghijklmnopqrstuvwxyz',
          refresh_token: undefined,
          expires_in: 3600,
          token_type: 'Bearer',
          scope: 'openid',
        },
      },
      refetch: mockRefetchLogsAndResult,
    });

    renderComponent();

    // Masked short token → full dot block
    await waitFor(() => {
      expect(screen.getByText('••••••••••••••••••••')).toBeTruthy();
    });

    // Reveal tokens → show raw values
    fireEvent.click(screen.getByText('Reveal Tokens'));
    await waitFor(() => {
      expect(screen.getByText('short')).toBeTruthy();
      expect(screen.getByText('abcdefghijklmnopqrstuvwxyz')).toBeTruthy();
    });

    // No refresh token section when absent
    expect(screen.queryByText('Refresh Token (refresh_token)')).toBeNull();
  });

  it('should copy refresh token and raw user payload to clipboard', async () => {
    const writeTextSpy = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextSpy },
      configurable: true,
      writable: true,
    });

    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Refresh Token (refresh_token)')).toBeTruthy();
    });

    // The copy buttons are unnamed (icon-only); pick the one adjacent to the
    // refresh-token label via the label's parent container.
    const refreshLabel = screen.getByText('Refresh Token (refresh_token)');
    const refreshCopyBtn = refreshLabel
      .closest('div')!
      .querySelector('button')!;
    fireEvent.click(refreshCopyBtn);
    await waitFor(() => {
      expect(writeTextSpy).toHaveBeenCalledWith('test_refresh_token');
    });

    // Open raw JSON + copy it
    fireEvent.click(screen.getByText('Raw User Info Payload'));
    await waitFor(() => {
      expect(screen.getByText('Copy JSON')).toBeTruthy();
    });
    fireEvent.click(screen.getByText('Copy JSON'));
    await waitFor(() => {
      expect(writeTextSpy).toHaveBeenCalledWith(
        expect.stringContaining('"email": "testuser@example.com"')
      );
    });
  });

  it('should hide refresh token and verification badges when absent', async () => {
    (useGoogleAuthEmulateControllerGetLastResultQuery as any).mockReturnValue({
      data: {
        ...sampleOAuthResult,
        tokens: {
          access_token: 'test_access_token',
          id_token: 'test_id_token',
          expires_in: 3600,
          token_type: 'Bearer',
          scope: 'openid',
        },
        userProfile: {
          sub: 'user_123',
          email: 'testuser@example.com',
          name: 'Test User',
          picture: 'https://example.com/pic.jpg',
          email_verified: false,
          hd: undefined,
        },
      },
      refetch: mockRefetchLogsAndResult,
    });

    renderComponent();
    await waitFor(() => {
      expect(screen.queryByText('Refresh Token (refresh_token)')).toBeNull();
      expect(screen.queryByText('Email Verified')).toBeNull();
      expect(screen.queryByText(/Domain:/)).toBeNull();
    });
  });
});
