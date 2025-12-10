import {
  createHttpLoggerMiddleware,
  HttpLoggerConfig,
  LogPayload,
} from './http-listener';
import { configureStore } from '@reduxjs/toolkit';
import { loggerReducer } from './logger.slice';
import { logInfo } from './logger.actions';

describe('HTTP Listener', () => {
  let store: ReturnType<typeof configureStore>;
  let onSendMock: jest.Mock;
  let onErrorMock: jest.Mock;

  const createTestStore = (config?: HttpLoggerConfig) => {
    return configureStore({
      reducer: {
        logger: loggerReducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(createHttpLoggerMiddleware(config)),
    });
  };

  beforeEach(() => {
    onSendMock = jest.fn();
    onErrorMock = jest.fn();
    store = createTestStore({ onSend: onSendMock, onError: onErrorMock });
  });

  it('should call onSend with log payload when addLog action is dispatched', async () => {
    const message = 'Test message';
    store.dispatch(logInfo(message));

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(onSendMock).toHaveBeenCalledTimes(1);
    const logPayload: LogPayload = onSendMock.mock.calls[0][0];
    expect(logPayload.message).toBe(message);
    expect(logPayload.level).toBe('info');
  });

  it('should handle async onSend callbacks correctly', async () => {
    const asyncOnSend = jest.fn().mockResolvedValue(undefined);
    store = createTestStore({ onSend: asyncOnSend });

    store.dispatch(logInfo('Async test'));

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(asyncOnSend).toHaveBeenCalledTimes(1);
  });

  it('should call onError when onSend throws', async () => {
    const error = new Error('Send failed');
    onSendMock.mockRejectedValue(error);

    store.dispatch(logInfo('Test message'));

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(onErrorMock).toHaveBeenCalledTimes(1);
    expect(onErrorMock).toHaveBeenCalledWith(
      error,
      expect.objectContaining({
        message: 'Test message',
        level: 'info',
      })
    );
  });

  it('should not throw when onError is not provided and onSend fails', async () => {
    const errorOnSend = jest.fn().mockRejectedValue(new Error('Send failed'));
    store = createTestStore({ onSend: errorOnSend });

    expect(() => {
      store.dispatch(logInfo('Test message'));
    }).not.toThrow();

    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  it('should work alongside console listener middleware', async () => {
    const consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
    const { createConsoleLoggerMiddleware } = await import(
      './console-listener'
    );

    store = configureStore({
      reducer: {
        logger: loggerReducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware()
          .concat(createConsoleLoggerMiddleware())
          .concat(createHttpLoggerMiddleware({ onSend: onSendMock })),
    });

    store.dispatch(logInfo('Dual logger test'));

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(consoleInfoSpy).toHaveBeenCalledWith('[INFO] Dual logger test');
    expect(onSendMock).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Dual logger test' }),
      expect.any(Function) // dispatch
    );

    consoleInfoSpy.mockRestore();
  });

  it('should pass dispatch as second argument to onSend', async () => {
    const onSendWithDispatch = jest.fn();
    store = createTestStore({ onSend: onSendWithDispatch });

    store.dispatch(logInfo('Dispatch test'));

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(onSendWithDispatch).toHaveBeenCalledTimes(1);
    const [logPayload, dispatch] = onSendWithDispatch.mock.calls[0];
    expect(logPayload.message).toBe('Dispatch test');
    expect(typeof dispatch).toBe('function');
  });

  it('should work without config (no-op)', async () => {
    store = createTestStore();

    // Should not throw when dispatching log action
    expect(() => {
      store.dispatch(logInfo('No-op test'));
    }).not.toThrow();

    await new Promise((resolve) => setTimeout(resolve, 0));

    // Log should still be in state
    const state = store.getState() as { logger: { logs: LogPayload[] } };
    expect(state.logger.logs).toHaveLength(1);
  });

  it('should work with empty config object', async () => {
    store = createTestStore({});

    expect(() => {
      store.dispatch(logInfo('Empty config test'));
    }).not.toThrow();

    await new Promise((resolve) => setTimeout(resolve, 0));

    const state = store.getState() as { logger: { logs: LogPayload[] } };
    expect(state.logger.logs).toHaveLength(1);
  });
});
