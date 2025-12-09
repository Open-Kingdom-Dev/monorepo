import { GlobalErrorListener } from './global-error.listener';

describe('GlobalErrorListener', () => {
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

  describe('attach', () => {
    it('should add error and unhandledrejection event listeners', () => {
      const listener = new GlobalErrorListener({
        logger: mockLogger,
        notificationHandler: mockNotificationHandler,
      });

      listener.attach();

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'error',
        expect.any(Function)
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'unhandledrejection',
        expect.any(Function)
      );
    });

    it('should return cleanup function that removes listeners', () => {
      const listener = new GlobalErrorListener({
        logger: mockLogger,
        notificationHandler: mockNotificationHandler,
      });

      const cleanup = listener.attach();
      expect(typeof cleanup).toBe('function');

      cleanup();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'error',
        expect.any(Function)
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'unhandledrejection',
        expect.any(Function)
      );
    });
  });

  describe('error handling', () => {
    it('should report uncaught errors', () => {
      const listener = new GlobalErrorListener({
        logger: mockLogger,
        notificationHandler: mockNotificationHandler,
      });
      listener.attach();

      window.dispatchEvent(
        new ErrorEvent('error', {
          error: new Error('Uncaught error'),
          filename: 'test.js',
          lineno: 10,
        })
      );

      expect(mockLogger).toHaveBeenCalled();
      expect(mockNotificationHandler).toHaveBeenCalled();
    });

    it('should report unhandled promise rejections', () => {
      const listener = new GlobalErrorListener({
        logger: mockLogger,
        notificationHandler: mockNotificationHandler,
      });
      listener.attach();

      const rejectionEvent = new CustomEvent('unhandledrejection');
      Object.defineProperty(rejectionEvent, 'reason', {
        value: 'Rejection reason',
      });
      Object.defineProperty(rejectionEvent, 'preventDefault', {
        value: jest.fn(),
      });

      window.dispatchEvent(rejectionEvent);

      expect(mockLogger).toHaveBeenCalled();
      expect(mockNotificationHandler).toHaveBeenCalled();
    });

    it('should use custom defaultMessage', () => {
      const listener = new GlobalErrorListener({
        logger: mockLogger,
        notificationHandler: mockNotificationHandler,
        defaultMessage: 'Oops! Something went wrong.',
      });
      listener.attach();

      window.dispatchEvent(
        new ErrorEvent('error', { error: new Error('Test') })
      );

      expect(mockNotificationHandler).toHaveBeenCalledWith(
        'Oops! Something went wrong.'
      );
    });

    it('should respect notify: false', () => {
      const listener = new GlobalErrorListener({
        logger: mockLogger,
        notificationHandler: mockNotificationHandler,
        notify: false,
      });
      listener.attach();

      window.dispatchEvent(
        new ErrorEvent('error', { error: new Error('Test') })
      );

      expect(mockLogger).toHaveBeenCalled();
      expect(mockNotificationHandler).not.toHaveBeenCalled();
    });

    it('should respect log: false', () => {
      const listener = new GlobalErrorListener({
        logger: mockLogger,
        notificationHandler: mockNotificationHandler,
        log: false,
      });
      listener.attach();

      window.dispatchEvent(
        new ErrorEvent('error', { error: new Error('Test') })
      );

      expect(mockLogger).not.toHaveBeenCalled();
      expect(mockNotificationHandler).toHaveBeenCalled();
    });
  });
});
