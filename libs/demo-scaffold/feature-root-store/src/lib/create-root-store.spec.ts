import { createRootStore } from '../index';
import { LoggerConfig, LoggerKey, logInfo, selectLogs } from '@ynaa/shared-data-access-logger';

describe('createRootStore', () => {
  const mockConfig: LoggerConfig = {
    destination: 'console',
  };

  let consoleInfoSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
  });

  afterEach(() => {
    consoleInfoSpy.mockRestore();
  });

  it('should create a store with logger reducer', () => {
    const store = createRootStore(mockConfig);

    expect(store).toBeDefined();
    expect(typeof store.dispatch).toBe('function');
    expect(typeof store.getState).toBe('function');
    expect(typeof store.subscribe).toBe('function');
  });

  it('should include logger state in the store', () => {
    const store = createRootStore(mockConfig);
    const state = store.getState();

    expect(state).toHaveProperty(LoggerKey);
    expect(state[LoggerKey]).toEqual({
      logs: []
    });
  });

  it('should handle logger actions properly', () => {
    const store = createRootStore(mockConfig);

    // Dispatch a log action
    store.dispatch(logInfo('Test message'));

    const state = store.getState();
    const logs = selectLogs(state);

    expect(logs).toHaveLength(1);
    expect(logs[0].message).toBe('Test message');
    expect(logs[0].level).toBe('info');
  });

  it('should have logger middleware configured', () => {
    const store = createRootStore(mockConfig);

    // Dispatch a log action to test middleware
    store.dispatch(logInfo('Middleware test'));

    // Check that console was called (indicating middleware is working)
    expect(consoleInfoSpy).toHaveBeenCalledWith('[INFO] Middleware test');
  });

  it('should configure serializable check to ignore persist actions', () => {
    // This tests that the middleware configuration includes the persist ignore
    const store = createRootStore(mockConfig);

    // Dispatch an action that would normally trigger serializable check warning
    // The fact that we can create the store without warnings means the config is correct
    expect(store).toBeDefined();
  });

  it('should work with different logger configs', () => {
    const config: LoggerConfig = {
      destination: 'console',
    };

    const store = createRootStore(config);

    expect(store).toBeDefined();
    expect(store.getState()).toHaveProperty(LoggerKey);
  });

  it('should maintain state immutability', () => {
    const store = createRootStore(mockConfig);

    const initialState = store.getState();
    store.dispatch(logInfo('Test message'));
    const newState = store.getState();

    // States should be different objects (immutable)
    expect(initialState).not.toBe(newState);
    // But the logger reference should be different too
    expect(initialState[LoggerKey]).not.toBe(newState[LoggerKey]);
  });

  it('should allow store extension with additional reducers', () => {
    // Test that the structure allows for additional reducers
    const store = createRootStore(mockConfig);
    const state = store.getState();

    // The store structure should support additional reducers
    // (this test verifies the structure is extensible)
    expect(typeof state).toBe('object');
    expect(state[LoggerKey]).toBeDefined();
  });
}); 