import { createConsoleListenerMiddleware } from './console-listener';
import { configureStore } from '@reduxjs/toolkit';
import { loggerReducer } from './logger.slice';

describe('Console Listener', () => {
  let store: ReturnType<typeof configureStore>;
  let consoleInfoSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        logger: loggerReducer
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(createConsoleListenerMiddleware())
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
    expect(createConsoleListenerMiddleware).toBeDefined();
  });
});
