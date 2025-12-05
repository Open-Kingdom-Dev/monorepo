import { createAppStore } from './store.config';
import { LoggerKey } from '@open-kingdom/shared-frontend-data-access-logger';

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
        logs: [],
      });
    });

    it('should create store with console logger middleware', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

      const store = createAppStore();

      // Dispatch a test action that should trigger console logging
      store.dispatch({
        type: 'logger/addLog',
        payload: { message: 'Test message', level: 'info' },
      });

      expect(consoleSpy).toHaveBeenCalledWith('[INFO] Test message');

      consoleSpy.mockRestore();
    });
  });
});
