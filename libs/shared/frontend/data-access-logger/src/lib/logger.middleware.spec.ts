import { createLoggerMiddleware } from './logger.middleware';
import { createConsoleListenerMiddleware } from './console-listener';
import { LoggerConfig } from './logger.types';

jest.mock('./console-listener');

describe('Logger Middleware', () => {
  const mockConsoleMiddleware = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (createConsoleListenerMiddleware as jest.Mock).mockReturnValue(
      mockConsoleMiddleware
    );
  });

  describe('createLoggerMiddleware', () => {
    it('should create console middleware when destination is console', () => {
      const config: LoggerConfig = {
        destination: 'console',
      };

      const result = createLoggerMiddleware(config);

      expect(createConsoleListenerMiddleware).toHaveBeenCalledTimes(1);
      expect(result).toBe(mockConsoleMiddleware);
    });

    it('should throw error for unsupported destination', () => {
      const config = {
        destination: 'file',
      } as any;

      expect(() => createLoggerMiddleware(config)).toThrow(
        'Unsupported logger destination: file'
      );
    });

    it('should throw error for undefined destination', () => {
      const config = {
        destination: undefined,
      } as any;

      expect(() => createLoggerMiddleware(config)).toThrow(
        'Unsupported logger destination: undefined'
      );
    });

    it('should throw error for null destination', () => {
      const config = {
        destination: null,
      } as any;

      expect(() => createLoggerMiddleware(config)).toThrow(
        'Unsupported logger destination: null'
      );
    });
  });
});
