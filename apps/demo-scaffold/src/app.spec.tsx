import { render, screen, fireEvent, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { App } from '../app/app';
import { LoggerKey, loggerReducer, createLoggerMiddleware, LoggerConfig, LoggerState } from '@ynaa/shared-data-access-logger';

describe('App Component', () => {
  let store: ReturnType<typeof configureStore>;
  let consoleInfoSpy: jest.SpyInstance;

  beforeEach(() => {
    const config: LoggerConfig = { destination: 'console' };
    
    store = configureStore({
      reducer: {
        [LoggerKey]: loggerReducer,
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
        <App />
      </Provider>
    );
  };

  it('should render successfully', () => {
    renderApp();
    expect(screen.getByText('Hello World')).toBeTruthy();
  });

  it('should display initial log count of 0', () => {
    renderApp();
    expect(screen.getByText('Logs: 0')).toBeTruthy();
  });

  it('should render log info button', () => {
    renderApp();
    expect(screen.getByText('Log Info')).toBeTruthy();
  });

  it('should increment log count when button is clicked', () => {
    renderApp();

    const button = screen.getByText('Log Info');
    fireEvent.click(button);

    expect(screen.getByText('Logs: 1')).toBeTruthy();
  });

  it('should log to console when button is clicked', () => {
    renderApp();

    const button = screen.getByText('Log Info');
    fireEvent.click(button);

    expect(consoleInfoSpy).toHaveBeenCalledWith('[INFO] Hello World');
  });

  it('should handle multiple button clicks', () => {
    renderApp();

    const button = screen.getByText('Log Info');
    
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    expect(screen.getByText('Logs: 3')).toBeTruthy();
    expect(consoleInfoSpy).toHaveBeenCalledTimes(3);
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
      store.dispatch({ type: 'logger/addLog', payload: { message: 'External log', level: 'info' } });
    });

    expect(screen.getByText('Logs: 1')).toBeTruthy();
  });

  it('should have proper component structure', () => {
    renderApp();

    // Check all expected elements are present
    expect(screen.getByRole('heading', { level: 1 })).toBeTruthy();
    expect(screen.getByText(/Logs:/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Log Info' })).toBeTruthy();
  });
}); 