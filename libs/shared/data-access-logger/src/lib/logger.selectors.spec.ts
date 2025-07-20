import {
  selectLoggerState,
  selectLogs,
  selectLogsByLevel,
  selectRecentLogs,
} from './logger.selectors';
import { LoggerState, LogEntry, RootStateContainingLogger, LoggerKey } from './logger.types';

describe('Logger Selectors', () => {
  const mockLogs: LogEntry[] = [
    {
      id: '1',
      message: 'Info message 1',
      level: 'info',
      timestamp: 1000,
    },
    {
      id: '2',
      message: 'Warning message',
      level: 'warn',
      timestamp: 2000,
    },
    {
      id: '3',
      message: 'Error message',
      level: 'error',
      timestamp: 3000,
    },
    {
      id: '4',
      message: 'Info message 2',
      level: 'info',
      timestamp: 4000,
    },
  ];

  const mockLoggerState: LoggerState = {
    logs: mockLogs,
  };

  const mockRootState: RootStateContainingLogger = {
    [LoggerKey]: mockLoggerState,
    otherState: { value: 'test' },
  };

  describe('selectLoggerState', () => {
    it('should select the logger state from root state', () => {
      const result = selectLoggerState(mockRootState);
      expect(result).toBe(mockLoggerState);
    });

    it('should work with empty logger state', () => {
      const emptyState: RootStateContainingLogger = {
        [LoggerKey]: { logs: [] },
      };
      const result = selectLoggerState(emptyState);
      expect(result).toEqual({ logs: [] });
    });
  });

  describe('selectLogs', () => {
    it('should select all logs from logger state', () => {
      const result = selectLogs(mockRootState);
      expect(result).toEqual(mockLogs);
    });

    it('should return empty array when no logs', () => {
      const emptyState: RootStateContainingLogger = {
        [LoggerKey]: { logs: [] },
      };
      const result = selectLogs(emptyState);
      expect(result).toEqual([]);
    });

    it('should be memoized', () => {
      const result1 = selectLogs(mockRootState);
      const result2 = selectLogs(mockRootState);
      expect(result1).toBe(result2);
    });
  });

  describe('selectLogsByLevel', () => {
    it('should filter logs by info level', () => {
      const result = selectLogsByLevel(mockRootState, 'info');
      expect(result).toHaveLength(2);
      expect(result[0].message).toBe('Info message 1');
      expect(result[1].message).toBe('Info message 2');
      expect(result.every(log => log.level === 'info')).toBe(true);
    });

    it('should filter logs by warn level', () => {
      const result = selectLogsByLevel(mockRootState, 'warn');
      expect(result).toHaveLength(1);
      expect(result[0].message).toBe('Warning message');
      expect(result[0].level).toBe('warn');
    });

    it('should filter logs by error level', () => {
      const result = selectLogsByLevel(mockRootState, 'error');
      expect(result).toHaveLength(1);
      expect(result[0].message).toBe('Error message');
      expect(result[0].level).toBe('error');
    });

    it('should return empty array when no logs match level', () => {
      const stateWithNoWarns: RootStateContainingLogger = {
        [LoggerKey]: {
          logs: [
            { id: '1', message: 'Info only', level: 'info', timestamp: 1000 }
          ],
        },
      };
      const result = selectLogsByLevel(stateWithNoWarns, 'warn');
      expect(result).toEqual([]);
    });

    it('should be memoized for same level', () => {
      const result1 = selectLogsByLevel(mockRootState, 'info');
      const result2 = selectLogsByLevel(mockRootState, 'info');
      expect(result1).toBe(result2);
    });
  });

  describe('selectRecentLogs', () => {
    it('should return last N logs', () => {
      const result = selectRecentLogs(mockRootState, 2);
      expect(result).toHaveLength(2);
      expect(result[0].message).toBe('Error message');
      expect(result[1].message).toBe('Info message 2');
    });

    it('should return all logs when count exceeds total', () => {
      const result = selectRecentLogs(mockRootState, 10);
      expect(result).toEqual(mockLogs);
    });

    it('should return empty array when count is 0', () => {
      const result = selectRecentLogs(mockRootState, 0);
      expect(result).toEqual([]);
    });

    it('should return single log when count is 1', () => {
      const result = selectRecentLogs(mockRootState, 1);
      expect(result).toHaveLength(1);
      expect(result[0].message).toBe('Info message 2');
    });

    it('should work with empty logs', () => {
      const emptyState: RootStateContainingLogger = {
        [LoggerKey]: { logs: [] },
      };
      const result = selectRecentLogs(emptyState, 5);
      expect(result).toEqual([]);
    });

    it('should be memoized for same count', () => {
      const result1 = selectRecentLogs(mockRootState, 2);
      const result2 = selectRecentLogs(mockRootState, 2);
      expect(result1).toBe(result2);
    });
  });
}); 