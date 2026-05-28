/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorSimulatorPanel, ErrorBanner } from './error-simulator-panel';
import { useDispatch } from 'react-redux';
import {
  useGcsStorageControllerActivateErrorModeMutation,
  useGcsStorageControllerDeactivateErrorModeMutation,
  useTwinControllerGetStatusQuery,
} from '@open-kingdom/shared-frontend-data-access-api-client';

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
}));

jest.mock('@open-kingdom/shared-frontend-data-access-api-client', () => ({
  useGcsStorageControllerActivateErrorModeMutation: jest.fn(),
  useGcsStorageControllerDeactivateErrorModeMutation: jest.fn(),
  useTwinControllerGetStatusQuery: jest.fn(),
}));

jest.mock('@open-kingdom/shared-frontend-data-access-notifications', () => ({
  showSuccessNotification: jest.fn((msg) => ({ type: 'SUCCESS', msg })),
  showErrorNotification: jest.fn((msg) => ({ type: 'ERROR', msg })),
}));

describe('ErrorBanner', () => {
  it('should render null when mode is inactive', () => {
    const { container } = render(
      <ErrorBanner mode={{ active: false, type: 'quota-exceeded' }} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render details when mode is active', () => {
    render(
      <ErrorBanner
        mode={{
          active: true,
          type: 'quota-exceeded',
          description: 'Custom error desc',
        }}
      />
    );
    expect(screen.getByText('⚠️ ERROR SIMULATION ACTIVE')).toBeTruthy();
    expect(screen.getByText('Quota Exceeded')).toBeTruthy();
    expect(screen.getByText('Custom error desc')).toBeTruthy();
  });
});

describe('ErrorSimulatorPanel', () => {
  let mockDispatch: jest.Mock;
  let mockActivate: jest.Mock;
  let mockDeactivate: jest.Mock;

  beforeEach(() => {
    mockDispatch = jest.fn();
    (useDispatch as any).mockReturnValue(mockDispatch);

    mockActivate = jest.fn().mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({}),
    });
    (useGcsStorageControllerActivateErrorModeMutation as any).mockReturnValue([
      mockActivate,
      { isLoading: false },
    ]);

    mockDeactivate = jest.fn().mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({}),
    });
    (useGcsStorageControllerDeactivateErrorModeMutation as any).mockReturnValue(
      [mockDeactivate, { isLoading: false }]
    );

    (useTwinControllerGetStatusQuery as any).mockReturnValue({
      data: {
        running: true,
        healthy: true,
        errorMode: { active: false },
      },
    });
  });

  it('renders correctly when twin is running and error mode is inactive', () => {
    render(<ErrorSimulatorPanel />);
    expect(screen.getByText('Error Simulator')).toBeTruthy();
    expect(
      screen.getByText(
        'No error mode active — all operations pass through normally.'
      )
    ).toBeTruthy();
    const btn = screen.getByRole('button', { name: 'Activate Error Mode' });
    expect(btn).toBeTruthy();
    expect(btn.hasAttribute('disabled')).toBe(false);
  });

  it('shows disabled banner and buttons when twin is not running', () => {
    (useTwinControllerGetStatusQuery as any).mockReturnValue({
      data: {
        running: false,
        healthy: false,
        errorMode: { active: false },
      },
    });

    render(<ErrorSimulatorPanel />);
    expect(
      screen.getByText('Start the GCS Twin to enable error simulation.')
    ).toBeTruthy();
    const btn = screen.getByRole('button', { name: 'Activate Error Mode' });
    expect(btn.hasAttribute('disabled')).toBe(true);
  });

  it('renders correctly when error mode is active', () => {
    (useTwinControllerGetStatusQuery as any).mockReturnValue({
      data: {
        running: true,
        healthy: true,
        errorMode: {
          active: true,
          type: 'quota-exceeded',
          description: 'A bad quota error',
        },
      },
    });

    render(<ErrorSimulatorPanel />);
    expect(screen.getByText(/Active:/i)).toBeTruthy();
    expect(screen.getAllByText('Quota Exceeded').length).toBe(2);
    expect(screen.getByText('A bad quota error')).toBeTruthy();

    const deactivateBtn = screen.getByRole('button', {
      name: 'Deactivate Error Mode',
    });
    expect(deactivateBtn).toBeTruthy();
  });

  it('allows selecting error modes and configures fields', () => {
    render(<ErrorSimulatorPanel />);

    // Select Bucket Not Found
    const bucketNotFoundBtn = screen.getByRole('button', {
      name: /Bucket Not Found/i,
    });
    fireEvent.click(bucketNotFoundBtn);

    // Should show Bucket Name input
    const bucketInput = screen.getByLabelText('Bucket Name');
    expect(bucketInput).toBeTruthy();
    fireEvent.change(bucketInput, { target: { value: 'user-uploads' } });

    // Select Intermittent Failure
    const intermittentBtn = screen.getByRole('button', {
      name: /Intermittent Failure/i,
    });
    fireEvent.click(intermittentBtn);

    // Should show Fail every Nth request input
    const failNInput = screen.getByLabelText('Fail every Nth request');
    expect(failNInput).toBeTruthy();
    fireEvent.change(failNInput, { target: { value: '5' } });
  });

  it('triggers handleActivate successfully', async () => {
    render(<ErrorSimulatorPanel />);

    const activateBtn = screen.getByRole('button', {
      name: 'Activate Error Mode',
    });
    fireEvent.click(activateBtn);

    expect(mockActivate).toHaveBeenCalledWith({
      activateErrorModeDto: {
        type: 'quota-exceeded',
      },
    });
    await Promise.resolve();
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'SUCCESS',
        msg: 'Error mode "quota-exceeded" activated',
      })
    );
  });

  it('triggers handleActivate with special params for bucket-not-found', async () => {
    render(<ErrorSimulatorPanel />);

    const bucketNotFoundBtn = screen.getByRole('button', {
      name: /Bucket Not Found/i,
    });
    fireEvent.click(bucketNotFoundBtn);

    const activateBtn = screen.getByRole('button', {
      name: 'Activate Error Mode',
    });
    fireEvent.click(activateBtn);

    expect(mockActivate).toHaveBeenCalledWith({
      activateErrorModeDto: {
        type: 'bucket-not-found',
        bucketName: 'app-assets',
      },
    });
  });

  it('triggers handleActivate with special params for intermittent-failure', async () => {
    render(<ErrorSimulatorPanel />);

    const intermittentBtn = screen.getByRole('button', {
      name: /Intermittent Failure/i,
    });
    fireEvent.click(intermittentBtn);

    const activateBtn = screen.getByRole('button', {
      name: 'Activate Error Mode',
    });
    fireEvent.click(activateBtn);

    expect(mockActivate).toHaveBeenCalledWith({
      activateErrorModeDto: {
        type: 'intermittent-failure',
        failEveryN: 2,
      },
    });
  });

  it('handles activation failure gracefully', async () => {
    mockActivate.mockReturnValue({
      unwrap: jest.fn().mockRejectedValue(new Error('Network error')),
    });

    render(<ErrorSimulatorPanel />);

    const activateBtn = screen.getByRole('button', {
      name: 'Activate Error Mode',
    });
    fireEvent.click(activateBtn);

    await Promise.resolve();
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ERROR',
        msg: 'Failed to activate: Network error',
      })
    );
  });

  it('triggers handleDeactivate successfully', async () => {
    (useTwinControllerGetStatusQuery as any).mockReturnValue({
      data: {
        running: true,
        healthy: true,
        errorMode: { active: true, type: 'quota-exceeded' },
      },
    });

    render(<ErrorSimulatorPanel />);

    const deactivateBtn = screen.getByRole('button', {
      name: 'Deactivate Error Mode',
    });
    fireEvent.click(deactivateBtn);

    expect(mockDeactivate).toHaveBeenCalled();
    await Promise.resolve();
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'SUCCESS',
        msg: 'Error mode deactivated',
      })
    );
  });

  it('handles deactivation failure gracefully', async () => {
    (useTwinControllerGetStatusQuery as any).mockReturnValue({
      data: {
        running: true,
        healthy: true,
        errorMode: { active: true, type: 'quota-exceeded' },
      },
    });
    mockDeactivate.mockReturnValue({
      unwrap: jest.fn().mockRejectedValue(new Error('Deactivate failed')),
    });

    render(<ErrorSimulatorPanel />);

    const deactivateBtn = screen.getByRole('button', {
      name: 'Deactivate Error Mode',
    });
    fireEvent.click(deactivateBtn);

    await Promise.resolve();
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ERROR',
        msg: 'Failed to deactivate: Deactivate failed',
      })
    );
  });
});
