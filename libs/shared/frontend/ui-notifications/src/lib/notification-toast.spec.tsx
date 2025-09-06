import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { NotificationToast } from './notification-toast';

describe('NotificationToast', () => {
  const mockNotification = {
    id: '1',
    message: 'Test notification',
    type: 'success' as const,
    timestamp: Date.now(),
    dismissed: false,
  };

  const mockOnDismissed = jest.fn();
  const mockOnRemoved = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render successfully', async () => {
    render(
      <NotificationToast
        notification={mockNotification}
        onDismissed={mockOnDismissed}
        onRemoved={mockOnRemoved}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Success')).toBeInTheDocument();
    });
    expect(screen.getByText('Test notification')).toBeInTheDocument();
  });

  it('should call onDismissed and onRemoved when dismiss button is clicked', async () => {
    render(
      <NotificationToast
        notification={mockNotification}
        onDismissed={mockOnDismissed}
        onRemoved={mockOnRemoved}
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Dismiss notification')).toBeInTheDocument();
    });

    const dismissButton = screen.getByLabelText('Dismiss notification');
    fireEvent.click(dismissButton);

    // Should immediately call onDismissed
    expect(mockOnDismissed).toHaveBeenCalledWith('1');

    // Should call onRemoved after animation delay
    await waitFor(
      () => {
        expect(mockOnRemoved).toHaveBeenCalledWith('1');
      },
      { timeout: 1000 }
    );
  });

  it('should render different types of notifications', async () => {
    const warningNotification = {
      ...mockNotification,
      type: 'warning' as const,
    };

    render(
      <NotificationToast
        notification={warningNotification}
        onDismissed={mockOnDismissed}
        onRemoved={mockOnRemoved}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Warning')).toBeInTheDocument();
    });

    const errorNotification = {
      ...mockNotification,
      type: 'error' as const,
    };

    render(
      <NotificationToast
        notification={errorNotification}
        onDismissed={mockOnDismissed}
        onRemoved={mockOnRemoved}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
    });
  });
});
