import { logInfo, logWarn, logError, addLog, clearLogs } from './logger.actions';
import { addLog as addLogAction, clearLogs as clearLogsAction } from './logger.slice';

describe('Logger Actions', () => {
  describe('Re-exported actions', () => {
    it('should re-export addLog action', () => {
      expect(addLog).toBe(addLogAction);
    });

    it('should re-export clearLogs action', () => {
      expect(clearLogs).toBe(clearLogsAction);
    });
  });

  describe('Helper action creators', () => {
    it('should create info log action', () => {
      const message = 'Test info message';
      const action = logInfo(message);
      
      expect(action.type).toBe('logger/addLog');
      expect(action.payload).toEqual({
        message,
        level: 'info'
      });
    });

    it('should create warn log action', () => {
      const message = 'Test warning message';
      const action = logWarn(message);
      
      expect(action.type).toBe('logger/addLog');
      expect(action.payload).toEqual({
        message,
        level: 'warn'
      });
    });

    it('should create error log action', () => {
      const message = 'Test error message';
      const action = logError(message);
      
      expect(action.type).toBe('logger/addLog');
      expect(action.payload).toEqual({
        message,
        level: 'error'
      });
    });
  });
}); 