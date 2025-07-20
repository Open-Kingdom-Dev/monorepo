import { createAppStore, getLoggerConfig, validateLoggerConfig } from '../app/store.config';
import { LoggerKey } from '@ynaa/shared-data-access-logger';

describe('Store Configuration', () => {
  describe('createAppStore', () => {
    it('should create a store with logger configuration', () => {
      const store = createAppStore();
      
      expect(store).toBeDefined();
      expect(typeof store.dispatch).toBe('function');
      expect(typeof store.getState).toBe('function');
      expect(typeof store.subscribe).toBe('function');
    });

    it('should include logger reducer in store state', () => {
      const store = createAppStore();
      const state = store.getState();
      
      expect(state).toHaveProperty(LoggerKey);
      expect(state[LoggerKey]).toEqual({
        logs: []
      });
    });

    it('should create store with console logger middleware', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
      
      const store = createAppStore();
      
      // Dispatch a test action that should trigger console logging
      store.dispatch({
        type: 'logger/addLog',
        payload: { message: 'Test message', level: 'info' }
      });
      
      expect(consoleSpy).toHaveBeenCalledWith('[INFO] Test message');
      
      consoleSpy.mockRestore();
    });

    it('should create consistent stores', () => {
      const store1 = createAppStore();
      const store2 = createAppStore();
      
      // Stores should be independent instances
      expect(store1).not.toBe(store2);
      
      // But should have the same initial state structure
      expect(store1.getState()).toEqual(store2.getState());
    });
  });

  describe('getLoggerConfig', () => {
    it('should return console logger configuration', () => {
      const config = getLoggerConfig();
      
      expect(config).toEqual({
        destination: 'console'
      });
    });

    it('should return consistent configuration', () => {
      const config1 = getLoggerConfig();
      const config2 = getLoggerConfig();
      
      expect(config1).toEqual(config2);
    });

    it('should have correct destination type', () => {
      const config = getLoggerConfig();
      
      expect(config.destination).toBe('console');
      expect(typeof config.destination).toBe('string');
    });
  });

  describe('validateLoggerConfig', () => {
    it('should validate console destination as valid', () => {
      const validConfig = { destination: 'console' as const };
      
      expect(validateLoggerConfig(validConfig)).toBe(true);
    });

    it('should invalidate non-console destinations', () => {
      const invalidConfig = { destination: 'file' as any };
      
      expect(validateLoggerConfig(invalidConfig)).toBe(false);
    });

    it('should invalidate undefined destination', () => {
      const invalidConfig = { destination: undefined as any };
      
      expect(validateLoggerConfig(invalidConfig)).toBe(false);
    });

    it('should invalidate null destination', () => {
      const invalidConfig = { destination: null as any };
      
      expect(validateLoggerConfig(invalidConfig)).toBe(false);
    });

    it('should validate current app logger config', () => {
      const appConfig = getLoggerConfig();
      
      expect(validateLoggerConfig(appConfig)).toBe(true);
    });
  });
}); 