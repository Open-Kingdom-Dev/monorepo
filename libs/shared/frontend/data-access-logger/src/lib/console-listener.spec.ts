import { createConsoleLoggerMiddleware } from './console-listener';
import { configureStore } from '@reduxjs/toolkit';
import { loggerReducer, addLog } from './logger.slice';
import { logInfo, logWarn, logError } from './logger.actions';

describe('Console Listener', () => {
  let store: ReturnType<typeof configureStore>;
  let consoleInfoSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        logger: loggerReducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(createConsoleLoggerMiddleware()),
    });

    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleInfoSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should be defined', () => {
    expect(createConsoleLoggerMiddleware).toBeDefined();
  });

  it('should create middleware function', () => {
    const middleware = createConsoleLoggerMiddleware();
    expect(typeof middleware).toBe('function');
  });

  it('should log info messages to console.info', () => {
    const message = 'Test info message';
    store.dispatch(logInfo(message));

    expect(consoleInfoSpy).toHaveBeenCalledWith(`[INFO] ${message}`);
    expect(consoleWarnSpy).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('should log warn messages to console.warn', () => {
    const message = 'Test warning message';
    store.dispatch(logWarn(message));

    expect(consoleWarnSpy).toHaveBeenCalledWith(`[WARN] ${message}`);
    expect(consoleInfoSpy).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('should log error messages to console.error', () => {
    const message = 'Test error message';
    store.dispatch(logError(message));

    expect(consoleErrorSpy).toHaveBeenCalledWith(`[ERROR] ${message}`);
    expect(consoleInfoSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('should handle multiple log actions', () => {
    store.dispatch(logInfo('Info message'));
    store.dispatch(logWarn('Warn message'));
    store.dispatch(logError('Error message'));

    expect(consoleInfoSpy).toHaveBeenCalledWith('[INFO] Info message');
    expect(consoleWarnSpy).toHaveBeenCalledWith('[WARN] Warn message');
    expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] Error message');
  });

  it('should respond to direct addLog actions', () => {
    store.dispatch(addLog({ message: 'Direct log', level: 'info' }));

    expect(consoleInfoSpy).toHaveBeenCalledWith('[INFO] Direct log');
  });

  it('should handle empty messages', () => {
    store.dispatch(logInfo(''));

    expect(consoleInfoSpy).toHaveBeenCalledWith('[INFO] ');
  });

  it('should handle special characters in messages', () => {
    const specialMessage = 'Message with \n newlines \t tabs and "quotes"';
    store.dispatch(logWarn(specialMessage));

    expect(consoleWarnSpy).toHaveBeenCalledWith(`[WARN] ${specialMessage}`);
  });
});
