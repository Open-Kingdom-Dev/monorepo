import { ErrorReporter } from './error-autologger';
import { ErrorAdapter } from './error-autologger.adapter';

describe('ErrorReporter', () => {
  let mockLogger: jest.Mock;
  let mockNotificationHandler: jest.Mock;

  beforeEach(() => {
    mockLogger = jest.fn();
    mockNotificationHandler = jest.fn();
  });

  describe('constructor', () => {
    it('should use default logger when not provided', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const reporter = new ErrorReporter({
        notificationHandler: mockNotificationHandler,
      });

      reporter.report(new Error('Test error'));

      expect(consoleSpy).toHaveBeenCalledWith('[Error]', 'Test error');
      consoleSpy.mockRestore();
    });

    it('should use default notification handler when not provided', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const reporter = new ErrorReporter({
        logger: mockLogger,
      });

      reporter.report(new Error('Test error'));

      expect(consoleSpy).toHaveBeenCalledWith('[Notification]', 'Test error');
      consoleSpy.mockRestore();
    });

    it('should use custom adapter when provided', () => {
      const mockAdapter = {
        adapt: jest.fn().mockReturnValue({
          message: 'Custom adapted message',
          originalError: 'error',
        }),
      } as unknown as ErrorAdapter;

      const reporter = new ErrorReporter({
        logger: mockLogger,
        notificationHandler: mockNotificationHandler,
        adapter: mockAdapter,
      });

      reporter.report('some error');

      expect(mockAdapter.adapt).toHaveBeenCalledWith('some error', undefined);
      expect(mockNotificationHandler).toHaveBeenCalledWith(
        'Custom adapted message'
      );
    });
  });

  describe('report', () => {
    let reporter: ErrorReporter;

    beforeEach(() => {
      reporter = new ErrorReporter({
        logger: mockLogger,
        notificationHandler: mockNotificationHandler,
      });
    });

    it('should log and notify by default', () => {
      reporter.report(new Error('Test error'));

      expect(mockLogger).toHaveBeenCalled();
      expect(mockNotificationHandler).toHaveBeenCalled();
    });

    it('should not log when log option is false', () => {
      reporter.report(new Error('Test error'), { log: false });

      expect(mockLogger).not.toHaveBeenCalled();
      expect(mockNotificationHandler).toHaveBeenCalled();
    });

    it('should not notify when notify option is false', () => {
      reporter.report(new Error('Test error'), { notify: false });

      expect(mockLogger).toHaveBeenCalled();
      expect(mockNotificationHandler).not.toHaveBeenCalled();
    });

    it('should use userMessage for notification when provided', () => {
      reporter.report(new Error('Technical error'), {
        userMessage: 'Something went wrong, please try again',
      });

      expect(mockNotificationHandler).toHaveBeenCalledWith(
        'Something went wrong, please try again'
      );
    });

    it('should include context in log message when provided', () => {
      reporter.report(new Error('Test error'), {
        context: { userId: '123', action: 'submit' },
      });

      expect(mockLogger).toHaveBeenCalledWith(
        expect.stringContaining('"userId":"123"')
      );
    });

    it('should handle string errors', () => {
      reporter.report('Simple error message');

      expect(mockLogger).toHaveBeenCalledWith('Simple error message');
      expect(mockNotificationHandler).toHaveBeenCalledWith(
        'Simple error message'
      );
    });

    it('should handle RTK-style errors', () => {
      reporter.report({ status: 404 });

      expect(mockLogger).toHaveBeenCalledWith('Request failed with status 404');
    });
  });
});
