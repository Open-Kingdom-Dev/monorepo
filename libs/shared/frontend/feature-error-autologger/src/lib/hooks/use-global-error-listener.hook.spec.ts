import { renderHook } from '@testing-library/react';
import { useGlobalErrorListener } from './use-global-error-listener.hook';

describe('useGlobalErrorListener', () => {
  let mockLogger: jest.Mock;
  let mockNotificationHandler: jest.Mock;
  let addEventListenerSpy: jest.SpyInstance;
  let removeEventListenerSpy: jest.SpyInstance;

  beforeEach(() => {
    mockLogger = jest.fn();
    mockNotificationHandler = jest.fn();
    addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  it('should attach event listeners on mount', () => {
    renderHook(() =>
      useGlobalErrorListener({
        logger: mockLogger,
        notificationHandler: mockNotificationHandler,
      })
    );

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'error',
      expect.any(Function)
    );
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'unhandledrejection',
      expect.any(Function)
    );
  });

  it('should remove event listeners on unmount', () => {
    const { unmount } = renderHook(() =>
      useGlobalErrorListener({
        logger: mockLogger,
        notificationHandler: mockNotificationHandler,
      })
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'error',
      expect.any(Function)
    );
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'unhandledrejection',
      expect.any(Function)
    );
  });

  it('should reattach listeners when config changes', () => {
    const { rerender } = renderHook(
      ({ logger }) =>
        useGlobalErrorListener({
          logger,
          notificationHandler: mockNotificationHandler,
        }),
      {
        initialProps: { logger: mockLogger },
      }
    );

    rerender({ logger: jest.fn() });

    expect(removeEventListenerSpy).toHaveBeenCalled();
    expect(addEventListenerSpy.mock.calls.length).toBeGreaterThan(2);
  });

  it('should handle errors dispatched to window', () => {
    renderHook(() =>
      useGlobalErrorListener({
        logger: mockLogger,
        notificationHandler: mockNotificationHandler,
      })
    );

    window.dispatchEvent(
      new ErrorEvent('error', { error: new Error('Test error') })
    );

    expect(mockLogger).toHaveBeenCalled();
    expect(mockNotificationHandler).toHaveBeenCalled();
  });

  it('should handle unhandled rejections', () => {
    renderHook(() =>
      useGlobalErrorListener({
        logger: mockLogger,
        notificationHandler: mockNotificationHandler,
      })
    );

    const rejectionEvent = new CustomEvent('unhandledrejection');
    Object.defineProperty(rejectionEvent, 'reason', {
      value: 'Test rejection',
    });
    Object.defineProperty(rejectionEvent, 'preventDefault', {
      value: jest.fn(),
    });

    window.dispatchEvent(rejectionEvent);

    expect(mockLogger).toHaveBeenCalled();
    expect(mockNotificationHandler).toHaveBeenCalled();
  });

  it('should respect notify: false', () => {
    renderHook(() =>
      useGlobalErrorListener({
        logger: mockLogger,
        notificationHandler: mockNotificationHandler,
        notify: false,
      })
    );

    window.dispatchEvent(
      new ErrorEvent('error', { error: new Error('Test error') })
    );

    expect(mockLogger).toHaveBeenCalled();
    expect(mockNotificationHandler).not.toHaveBeenCalled();
  });

  it('should respect log: false', () => {
    renderHook(() =>
      useGlobalErrorListener({
        logger: mockLogger,
        notificationHandler: mockNotificationHandler,
        log: false,
      })
    );

    window.dispatchEvent(
      new ErrorEvent('error', { error: new Error('Test error') })
    );

    expect(mockLogger).not.toHaveBeenCalled();
    expect(mockNotificationHandler).toHaveBeenCalled();
  });

  it('should use custom defaultMessage', () => {
    renderHook(() =>
      useGlobalErrorListener({
        logger: mockLogger,
        notificationHandler: mockNotificationHandler,
        defaultMessage: 'Custom error message',
      })
    );

    window.dispatchEvent(
      new ErrorEvent('error', { error: new Error('Test error') })
    );

    expect(mockNotificationHandler).toHaveBeenCalledWith(
      'Custom error message'
    );
  });
});
