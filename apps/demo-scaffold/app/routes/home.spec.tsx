import { render, screen, fireEvent, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { Home } from './home';
import {
  LoggerKey,
  loggerReducer,
  createLoggerMiddleware,
  LoggerConfig,
  LoggerState,
} from '@open-kingdom/shared-frontend-data-access-logger';
import { ThemeProvider } from '@open-kingdom/shared-frontend-ui-theme';
import {
  NotificationKey,
  notificationReducer,
} from '@open-kingdom/shared-frontend-data-access-notifications';
import { SharedFeatureNotifications } from '@open-kingdom/shared-feature-notifications';

describe('App Component', () => {
  let store: ReturnType<typeof configureStore>;
  let consoleInfoSpy: jest.SpyInstance;

  beforeEach(() => {
    const config: LoggerConfig = { destination: 'console' };

    store = configureStore({
      reducer: {
        [LoggerKey]: loggerReducer,
        [NotificationKey]: notificationReducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(createLoggerMiddleware(config)),
    });

    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
  });

  afterEach(() => {
    consoleInfoSpy.mockRestore();
  });

  const renderApp = () => {
    return render(
      <Provider store={store}>
        <ThemeProvider>
          <Home />
          <SharedFeatureNotifications />
        </ThemeProvider>
      </Provider>
    );
  };

  it('should render successfully', () => {
    renderApp();
    expect(screen.getByText('Hello World')).toBeTruthy();
  });

  it('should render log info button', () => {
    renderApp();
    expect(screen.getByText('Log Info')).toBeTruthy();
  });

  it('should connect to Redux store properly', () => {
    renderApp();

    // Initial state
    const state = store.getState() as { [LoggerKey]: LoggerState };
    expect(state[LoggerKey].logs).toHaveLength(0);

    // Click button to dispatch action
    const button = screen.getByText('Log Info');
    fireEvent.click(button);

    // Check state was updated
    const newState = store.getState() as { [LoggerKey]: LoggerState };
    expect(newState[LoggerKey].logs).toHaveLength(1);
    expect(newState[LoggerKey].logs[0].message).toBe('Hello World');
    expect(newState[LoggerKey].logs[0].level).toBe('info');
  });

  it('should update display when store state changes externally', () => {
    renderApp();

    // Manually dispatch action to store
    act(() => {
      store.dispatch({
        type: 'logger/addLog',
        payload: { message: 'External log', level: 'info' },
      });
    });

    expect(screen.getByTestId('logs-count')).toHaveTextContent('1');
  });

  it('should toggle from light to dark mode', () => {
    renderApp();

    // Should start in light mode (default)
    expect(screen.getByText('Toggle Dark Mode')).toBeInTheDocument();

    // Click toggle button
    fireEvent.click(screen.getByText('Toggle Dark Mode'));

    // Should now show light mode toggle (meaning we're in dark mode)
    expect(screen.getByText('Toggle Light Mode')).toBeInTheDocument();
  });

  it('should toggle from dark to light mode', () => {
    // Start with dark mode
    render(
      <Provider store={store}>
        <ThemeProvider initialMode="dark">
          <Home />
        </ThemeProvider>
      </Provider>
    );

    // Should start in dark mode
    expect(screen.getByText('Toggle Light Mode')).toBeInTheDocument();

    // Click toggle button
    fireEvent.click(screen.getByText('Toggle Light Mode'));

    // Should now show dark mode toggle (meaning we're in light mode)
    expect(screen.getByText('Toggle Dark Mode')).toBeInTheDocument();
  });
  it('should connect to the notification store', () => {
    renderApp();
    let button = screen.getByText('Success');
    fireEvent.click(button);
    expect(
      screen.getByText('Operation completed successfully!')
    ).toBeInTheDocument();
    button = screen.getByText('Warning');
    fireEvent.click(button);
    expect(
      screen.getByText('Please review your input before proceeding.')
    ).toBeInTheDocument();
    button = screen.getByText('Error');
    fireEvent.click(button);
    expect(
      screen.getByText('An error occurred while processing your request.')
    ).toBeInTheDocument();
  });
});
