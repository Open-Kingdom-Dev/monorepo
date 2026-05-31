/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GmailDemo from './gmail-demo';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import {
  useTwinControllerGetStatusQuery,
  useTwinControllerStartMutation,
  useEmailControllerSendEmailMutation,
} from '@open-kingdom/shared-frontend-data-access-api-client';

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
}));

jest.mock('@open-kingdom/shared-frontend-data-access-api-client', () => ({
  useTwinControllerGetStatusQuery: jest.fn(),
  useTwinControllerStartMutation: jest.fn(),
  useEmailControllerSendEmailMutation: jest.fn(),
}));

jest.mock('@open-kingdom/shared-frontend-data-access-notifications', () => ({
  showSuccessNotification: jest.fn((msg) => ({ type: 'SUCCESS', msg })),
  showErrorNotification: jest.fn((msg) => ({ type: 'ERROR', msg })),
}));

jest.mock('../components', () => ({
  TwinStatus: () => <div data-testid="twin-status">TwinStatus Mock</div>,
}));

jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

describe('GmailDemo', () => {
  let mockDispatch: jest.Mock;
  let mockStartTwin: jest.Mock;
  let mockSendEmail: jest.Mock;

  beforeEach(() => {
    mockDispatch = jest.fn();
    (useDispatch as any).mockReturnValue(mockDispatch);

    mockStartTwin = jest.fn().mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({}),
    });
    (useTwinControllerStartMutation as any).mockReturnValue([
      mockStartTwin,
      { isLoading: false },
    ]);

    mockSendEmail = jest.fn().mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({}),
    });
    (useEmailControllerSendEmailMutation as any).mockReturnValue([
      mockSendEmail,
      { isLoading: false },
    ]);

    (useTwinControllerGetStatusQuery as any).mockReturnValue({
      data: {
        running: true,
        healthy: true,
        realGmailConfigured: false,
        errorMode: { active: false },
      },
      refetch: jest.fn(),
    });

    (axios.get as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/twin/gmail/emails')) {
        return Promise.resolve({
          status: 200,
          data: [],
        });
      }
      return Promise.resolve({
        status: 200,
        data: {},
      });
    });

    (axios.post as jest.Mock).mockResolvedValue({
      status: 200,
      data: {},
    });
  });

  it('renders correctly when Twin is running', async () => {
    (axios.get as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/twin/gmail/emails')) {
        return Promise.resolve({
          status: 200,
          data: [
            {
              id: 'msg-1',
              from: 'sender@example.com',
              to: 'recipient@example.com',
              subject: 'Intercepted email',
              text: 'Hello content',
              date: new Date().toISOString(),
            },
          ],
        });
      }
      return Promise.resolve({
        status: 200,
        data: {},
      });
    });

    render(<GmailDemo />);

    expect(screen.getByText('Gmail Digital Twin Control Console')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: /Send via Gmail Twin Server/i })
    ).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByText(/Intercepted email/i)).toBeTruthy();
    });
  });

  it('renders correctly when Twin is offline but production Gmail is configured', () => {
    (useTwinControllerGetStatusQuery as any).mockReturnValue({
      data: {
        running: false,
        healthy: false,
        realGmailConfigured: true,
        errorMode: { active: false },
      },
      refetch: jest.fn(),
    });

    render(<GmailDemo />);
    expect(
      screen.getByRole('button', { name: /Send via Production Gmail API/i })
    ).toBeTruthy();
  });

  it('renders correctly when both Twin and production Gmail are disabled', () => {
    (useTwinControllerGetStatusQuery as any).mockReturnValue({
      data: {
        running: false,
        healthy: false,
        realGmailConfigured: false,
        errorMode: { active: false },
      },
      refetch: jest.fn(),
    });

    render(<GmailDemo />);
    expect(
      screen.getByRole('button', { name: /Email Service Disabled/i })
    ).toBeTruthy();
  });

  it('triggers send email successfully', async () => {
    mockSendEmail.mockReturnValue({
      unwrap: jest
        .fn()
        .mockResolvedValue({ success: true, messageId: 'msg-123' }),
    });

    render(<GmailDemo />);

    const sendBtn = screen.getByRole('button', {
      name: /Send via Gmail Twin Server/i,
    });
    fireEvent.click(sendBtn);

    expect(mockSendEmail).toHaveBeenCalledWith({
      sendEmailDto: {
        to: 'recipient@openkingdom.dev',
        subject: 'Digital Twin Interception Verification',
        body: 'Hello Team, this email is automatically intercepted at the network level by our NodeInterceptor layer!',
      },
    });

    await Promise.resolve();
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'SUCCESS',
        msg: expect.stringContaining('Email sent successfully!'),
      })
    );
  });

  it('handles clear mailbox interaction', async () => {
    window.confirm = jest.fn().mockReturnValue(true);
    (axios.get as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/twin/gmail/emails')) {
        return Promise.resolve({
          status: 200,
          data: [
            {
              id: 'msg-1',
              from: 'sender@example.com',
              to: 'recipient@example.com',
              subject: 'Intercepted email',
              text: 'Hello content',
              date: new Date().toISOString(),
            },
          ],
        });
      }
      return Promise.resolve({
        status: 200,
        data: {},
      });
    });

    render(<GmailDemo />);

    // Wait for initial emails fetch to resolve and render emails to enable the Clear Inbox button
    await screen.findByText(/Intercepted email/i);

    const clearBtn = screen.getByRole('button', { name: /Clear Inbox/i });
    fireEvent.click(clearBtn);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/twin/gmail/reset');
    });
  });

  it('handles setting error simulation mode', async () => {
    render(<GmailDemo />);

    const button = screen.getByRole('button', { name: /429 Rate Limit/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/twin/gmail/error-mode', {
        mode: 'rate-limit',
      });
    });
  });

  it('triggers send email failure response', async () => {
    mockSendEmail.mockReturnValue({
      unwrap: jest
        .fn()
        .mockResolvedValue({ success: false, error: 'SMTP Timeout' }),
    });

    render(<GmailDemo />);

    const sendBtn = screen.getByRole('button', {
      name: /Send via Gmail Twin Server/i,
    });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ERROR',
          msg: 'Email sending failed: SMTP Timeout',
        })
      );
    });
  });

  it('triggers send email RTK query thrown error', async () => {
    mockSendEmail.mockReturnValue({
      unwrap: jest.fn().mockRejectedValue({
        data: { message: 'Failed to dispatch' },
      }),
    });

    render(<GmailDemo />);

    const sendBtn = screen.getByRole('button', {
      name: /Send via Gmail Twin Server/i,
    });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ERROR',
          msg: 'Execution error: Failed to dispatch',
        })
      );
    });
  });

  it('handles clear mailbox fetch reset error', async () => {
    window.confirm = jest.fn().mockReturnValue(true);
    (axios.get as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/twin/gmail/emails')) {
        return Promise.resolve({
          status: 200,
          data: [{ id: '1', from: 'a', to: 'b', subject: 'test', text: 'hi' }],
        });
      }
      return Promise.resolve({ status: 200, data: {} });
    });
    (axios.post as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/twin/gmail/reset')) {
        return Promise.reject(new Error('Reset Failed'));
      }
      return Promise.resolve({ status: 200, data: {} });
    });

    render(<GmailDemo />);

    await screen.findByText(/test/i);

    const clearBtn = screen.getByRole('button', { name: /Clear Inbox/i });
    fireEvent.click(clearBtn);

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ERROR',
          msg: 'Failed to clear mailbox',
        })
      );
    });
  });

  it('handles setting error simulation mode fetch failure', async () => {
    (axios.get as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/twin/gmail/emails')) {
        return Promise.resolve({ status: 200, data: [] });
      }
      return Promise.resolve({ status: 200, data: {} });
    });
    (axios.post as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/twin/gmail/error-mode')) {
        return Promise.reject(new Error('Fetch Failed'));
      }
      return Promise.resolve({ status: 200, data: {} });
    });

    render(<GmailDemo />);

    const button = screen.getByRole('button', { name: /429 Rate Limit/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ERROR',
          msg: 'Failed to set error mode',
        })
      );
    });
  });

  it('handles status sync fetch error', () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {
        // noop
      });
    (axios.get as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/twin/status')) {
        return Promise.reject(new Error('Status Fetch Failed'));
      }
      if (url.includes('/api/twin/gmail/emails')) {
        return Promise.resolve({ status: 200, data: [] });
      }
      return Promise.resolve({ status: 200, data: {} });
    });

    render(<GmailDemo />);
    expect(screen.getByText('Gmail Digital Twin Control Console')).toBeTruthy();
    consoleErrorSpy.mockRestore();
  });

  it('handles boot twin error when production Gmail is unconfigured', async () => {
    (useTwinControllerGetStatusQuery as any).mockReturnValue({
      data: {
        running: false,
        healthy: false,
        realGmailConfigured: false,
        errorMode: { active: false },
      },
      refetch: jest.fn(),
    });
    mockStartTwin.mockReturnValue({
      unwrap: jest.fn().mockRejectedValue(new Error('Boot failed')),
    });

    render(<GmailDemo />);
    const bootBtn = screen.getByRole('button', { name: 'Boot Environment' });
    fireEvent.click(bootBtn);

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'ERROR', msg: 'Failed to start twin' })
      );
    });
  });

  it('handles boot twin error when production Gmail is configured', async () => {
    (useTwinControllerGetStatusQuery as any).mockReturnValue({
      data: {
        running: false,
        healthy: false,
        realGmailConfigured: true,
        errorMode: { active: false },
      },
      refetch: jest.fn(),
    });
    mockStartTwin.mockReturnValue({
      unwrap: jest.fn().mockRejectedValue(new Error('Boot failed')),
    });

    render(<GmailDemo />);
    const bootBtn = screen.getByRole('button', { name: 'Boot Environment' });
    fireEvent.click(bootBtn);

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'ERROR', msg: 'Failed to start twin' })
      );
    });
  });

  it('handles boot twin success when production Gmail is unconfigured', async () => {
    const mockRefetch = jest.fn();
    (useTwinControllerGetStatusQuery as any).mockReturnValue({
      data: {
        running: false,
        healthy: false,
        realGmailConfigured: false,
        errorMode: { active: false },
      },
      refetch: mockRefetch,
    });
    mockStartTwin.mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({}),
    });

    render(<GmailDemo />);
    const bootBtn = screen.getByRole('button', { name: 'Boot Environment' });
    fireEvent.click(bootBtn);

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'SUCCESS',
          msg: 'Gmail Twin booted successfully',
        })
      );
    });
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('handles boot twin success when production Gmail is configured', async () => {
    const mockRefetch = jest.fn();
    (useTwinControllerGetStatusQuery as any).mockReturnValue({
      data: {
        running: false,
        healthy: false,
        realGmailConfigured: true,
        errorMode: { active: false },
      },
      refetch: mockRefetch,
    });
    mockStartTwin.mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({}),
    });

    render(<GmailDemo />);
    const bootBtn = screen.getByRole('button', { name: 'Boot Environment' });
    fireEvent.click(bootBtn);

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'SUCCESS',
          msg: 'Gmail Twin booted successfully',
        })
      );
    });
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('renders correctly when sending email is loading', () => {
    (useEmailControllerSendEmailMutation as any).mockReturnValue([
      mockSendEmail,
      { isLoading: true },
    ]);

    render(<GmailDemo />);
    const sendBtn = screen.getByRole('button', { name: /Sending Outbound/i });
    expect(sendBtn.hasAttribute('disabled')).toBe(true);
  });

  it('handles emails fetch error gracefully', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {
        // noop
      });
    (axios.get as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/twin/gmail/emails')) {
        return Promise.reject(new Error('Emails Fetch Failed'));
      }
      return Promise.resolve({ status: 200, data: {} });
    });

    render(<GmailDemo />);
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to fetch intercepted emails',
        expect.any(Error)
      );
    });
    consoleErrorSpy.mockRestore();
  });

  it('handles setting bad request and auth error simulation modes', async () => {
    render(<GmailDemo />);

    const badRequestBtn = screen.getByRole('button', {
      name: /400 Bad Request/i,
    });
    fireEvent.click(badRequestBtn);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/twin/gmail/error-mode', {
        mode: 'bad-request',
      });
    });

    const forbiddenBtn = screen.getByRole('button', { name: /403 Forbidden/i });
    fireEvent.click(forbiddenBtn);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/twin/gmail/error-mode', {
        mode: 'auth-error',
      });
    });
  });
});
