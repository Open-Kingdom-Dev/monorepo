import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import GoogleAuthDemo from './google-auth-demo';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('GoogleAuthDemo Route Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockedAxios.get.mockImplementation((url) => {
      if (url === '/api/google-auth-emulate/status') {
        return Promise.resolve({
          data: {
            running: true,
            healthy: true,
            port: 9015,
            url: 'http://localhost:9015',
          },
        });
      }
      if (url === '/api/google-auth-emulate/logs') {
        return Promise.resolve({
          data: [
            {
              id: 'log_1',
              timestamp: new Date().toISOString(),
              method: 'POST',
              url: 'http://localhost:9015/oauth2/token',
              statusCode: 200,
              requestHeaders: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              requestBody: 'code=123',
              responseHeaders: { 'content-type': 'application/json' },
              responseBody: '{"access_token":"abc"}',
              latencyMs: 10,
            },
          ],
        });
      }
      if (url === '/api/google-auth-emulate/last-result') {
        return Promise.resolve({
          data: {
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
            apiLogs: [],
          },
        });
      }
      if (url === '/api/google-auth-emulate/login-url') {
        return Promise.resolve({
          data: { authUrl: 'http://localhost:9015/o/oauth2/v2/auth' },
        });
      }
      return Promise.resolve({ data: {} });
    });

    mockedAxios.post.mockResolvedValue({ data: { success: true } });
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
      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/google-auth-emulate/stop'
      );
    });
  });

  it('should handle reset emulator button click', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Reset')).toBeTruthy();
    });

    fireEvent.click(screen.getByText('Reset'));

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/google-auth-emulate/reset'
      );
    });
  });

  it('should handle sign out button click', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Sign Out (Clear Session)')).toBeTruthy();
    });

    fireEvent.click(screen.getByText('Sign Out (Clear Session)'));

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/google-auth-emulate/logout'
      );
    });
  });

  it('should handle clear logs button click', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Clear Inspector')).toBeTruthy();
    });

    fireEvent.click(screen.getByText('Clear Inspector'));

    await waitFor(() => {
      expect(screen.getByText('No HTTP API calls captured yet.')).toBeTruthy();
    });
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

  it('should render offline status when status fetch fails or returns running=false', async () => {
    mockedAxios.get.mockImplementation((url) => {
      if (url === '/api/google-auth-emulate/status') {
        return Promise.reject(new Error('Network error'));
      }
      return Promise.resolve({ data: [] });
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
});
