import { renderHook, act } from '@testing-library/react';
import { useErrorReporter } from './use-error-reporter.hook';

describe('useErrorReporter', () => {
  let mockLogger: jest.Mock;
  let mockNotificationHandler: jest.Mock;

  beforeEach(() => {
    mockLogger = jest.fn();
    mockNotificationHandler = jest.fn();
  });

  it('should return a report function', () => {
    const { result } = renderHook(() =>
      useErrorReporter({
        logger: mockLogger,
        notificationHandler: mockNotificationHandler,
      })
    );

    expect(typeof result.current).toBe('function');
  });

  it('should report errors when called', () => {
    const { result } = renderHook(() =>
      useErrorReporter({
        logger: mockLogger,
        notificationHandler: mockNotificationHandler,
      })
    );

    act(() => {
      result.current(new Error('Test error'));
    });

    expect(mockLogger).toHaveBeenCalled();
    expect(mockNotificationHandler).toHaveBeenCalled();
  });

  it('should pass options to the reporter', () => {
    const { result } = renderHook(() =>
      useErrorReporter({
        logger: mockLogger,
        notificationHandler: mockNotificationHandler,
      })
    );

    act(() => {
      result.current(new Error('Test error'), {
        notify: false,
        userMessage: 'Custom message',
      });
    });

    expect(mockLogger).toHaveBeenCalled();
    expect(mockNotificationHandler).not.toHaveBeenCalled();
  });

  it('should memoize the reporter based on options', () => {
    const { result, rerender } = renderHook(
      ({ logger, notificationHandler }) =>
        useErrorReporter({ logger, notificationHandler }),
      {
        initialProps: {
          logger: mockLogger,
          notificationHandler: mockNotificationHandler,
        },
      }
    );

    const firstReportFn = result.current;

    // Rerender with same props
    rerender({
      logger: mockLogger,
      notificationHandler: mockNotificationHandler,
    });

    expect(result.current).toBe(firstReportFn);
  });

  it('should create new reporter when options change', () => {
    const { result, rerender } = renderHook(
      ({ logger, notificationHandler }) =>
        useErrorReporter({ logger, notificationHandler }),
      {
        initialProps: {
          logger: mockLogger,
          notificationHandler: mockNotificationHandler,
        },
      }
    );

    const firstReportFn = result.current;
    const newLogger = jest.fn();

    rerender({
      logger: newLogger,
      notificationHandler: mockNotificationHandler,
    });

    expect(result.current).not.toBe(firstReportFn);
  });

  it('should use default handlers when not provided', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

    const { result } = renderHook(() => useErrorReporter());

    act(() => {
      result.current(new Error('Test error'));
    });

    expect(consoleSpy).toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it('should handle string errors', () => {
    const { result } = renderHook(() =>
      useErrorReporter({
        logger: mockLogger,
        notificationHandler: mockNotificationHandler,
      })
    );

    act(() => {
      result.current('Simple error message');
    });

    expect(mockLogger).toHaveBeenCalledWith('Simple error message');
  });

  it('should include context in error report', () => {
    const { result } = renderHook(() =>
      useErrorReporter({
        logger: mockLogger,
        notificationHandler: mockNotificationHandler,
      })
    );

    act(() => {
      result.current(new Error('Test error'), {
        context: { userId: '123' },
      });
    });

    expect(mockLogger).toHaveBeenCalledWith(expect.stringContaining('userId'));
  });
});
