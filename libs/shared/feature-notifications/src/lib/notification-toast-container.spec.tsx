import {
  render,
  screen,
  waitFor,
  act,
  fireEvent,
} from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import '@testing-library/jest-dom';

import { notificationReducer } from '@ynaa/shared-data-access-notifications';

import { NotificationToastContainer } from './notification-toast-container';

// Create a test store
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      notifications: notificationReducer,
    },
    preloadedState: {
      notifications: {
        notifications: [],
        config: {
          maxNotifications: 5,
          autoDismiss: true,
          dismissTimeout: 5000,
        },
        ...initialState,
      },
    },
  });
};

describe('NotificationToastContainer', () => {
  it('should render nothing when no notifications', () => {
    const store = createTestStore();

    const { container } = render(
      <Provider store={store}>
        <NotificationToastContainer />
      </Provider>
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render notifications when they exist', async () => {
    const mockNotifications = [
      {
        id: '1',
        message: 'Test success notification',
        type: 'success' as const,
        timestamp: Date.now(),
        dismissed: false,
      },
      {
        id: '2',
        message: 'Test warning notification',
        type: 'warning' as const,
        timestamp: Date.now(),
        dismissed: false,
      },
    ];

    const store = createTestStore({
      notifications: mockNotifications,
    });

    render(
      <Provider store={store}>
        <NotificationToastContainer />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Success')).toBeInTheDocument();
    });
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('Test success notification')).toBeInTheDocument();
    expect(screen.getByText('Test warning notification')).toBeInTheDocument();
  });

  it('should not render dismissed notifications', () => {
    const mockNotifications = [
      {
        id: '1',
        message: 'Test notification',
        type: 'success' as const,
        timestamp: Date.now(),
        dismissed: true,
      },
    ];

    const store = createTestStore({
      notifications: mockNotifications,
    });

    const { container } = render(
      <Provider store={store}>
        <NotificationToastContainer />
      </Provider>
    );

    expect(container.firstChild).toBeNull();
  });

  it('should auto-dismiss notifications', () => {
    jest.useFakeTimers();

    const mockNotifications = [
      {
        id: '1',
        message: 'Test notification',
        type: 'success' as const,
        timestamp: Date.now(),
      },
    ];
    const store = createTestStore({
      notifications: mockNotifications,
      config: {
        maxNotifications: 5,
        autoDismiss: true,
        dismissTimeout: 100, // short timeout for deterministic test
      },
    });

    render(
      <Provider store={store}>
        <NotificationToastContainer />
      </Provider>
    );

    // Allow mount animation in NotificationToast (10ms) and any effects
    act(() => {
      jest.advanceTimersByTime(10);
    });
    expect(screen.getByText('Success')).toBeInTheDocument();

    // Advance to auto-dismiss (100ms)
    act(() => {
      jest.advanceTimersByTime(450);
    });

    // After dismiss, the item is filtered from active notifications
    expect(screen.queryByText('Success')).not.toBeInTheDocument();

    jest.useRealTimers();
  });

  it('should handle dismissing a notification', async () => {
    jest.useFakeTimers();

    const mockNotifications = [
      {
        id: '1',
        message: 'Test notification',
        type: 'success' as const,
        timestamp: Date.now(),
      },
    ];
    const store = createTestStore({
      notifications: mockNotifications,
      config: {
        maxNotifications: 5,
        autoDismiss: true,
        dismissTimeout: 5000,
      },
    });

    render(
      <Provider store={store}>
        <NotificationToastContainer />
      </Provider>
    );
    act(() => {
      jest.advanceTimersByTime(100);
    });

    const dismissButton = screen.getByTestId('dismiss-button');
    fireEvent.click(dismissButton);
    act(() => {
      jest.advanceTimersByTime(400);
    });
    expect(screen.queryByText('Test notification')).not.toBeInTheDocument();
  });

  it('should not auto-dismiss notifications if autoDismiss is false', () => {
    jest.useFakeTimers();

    const mockNotifications = [
      {
        id: '1',
        message: 'Test notification',
        type: 'success' as const,
        timestamp: Date.now(),
      },
    ];
    const store = createTestStore({
      notifications: mockNotifications,
      config: {
        maxNotifications: 5,
        autoDismiss: false,
        dismissTimeout: 5000,
      },
    });

    render(
      <Provider store={store}>
        <NotificationToastContainer />
      </Provider>
    );
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(screen.getByText('Test notification')).toBeInTheDocument();
    jest.advanceTimersByTime(6000);
    expect(screen.getByText('Test notification')).toBeInTheDocument();
  });
});
