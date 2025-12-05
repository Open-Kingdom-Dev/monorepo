import type { Middleware } from '@reduxjs/toolkit';
import {
  createRTKErrorMiddleware,
  createReduxRTKErrorMiddleware,
} from './rtk-error.middleware';

describe('createRTKErrorMiddleware', () => {
  let mockLogger: jest.Mock;
  let mockNotificationHandler: jest.Mock;
  let mockNext: jest.Mock;
  let mockGetState: jest.Mock;

  beforeEach(() => {
    mockLogger = jest.fn();
    mockNotificationHandler = jest.fn();
    mockNext = jest.fn((action) => action);
    mockGetState = jest.fn();
  });

  it('should return a middleware function', () => {
    const middleware = createRTKErrorMiddleware();
    expect(typeof middleware).toBe('function');
  });

  describe('rejected action handling', () => {
    let middleware: Middleware;

    beforeEach(() => {
      middleware = createRTKErrorMiddleware({
        logger: mockLogger,
        notificationHandler: mockNotificationHandler,
      });
    });

    it('should handle actions ending with /rejected', () => {
      const action = {
        type: 'api/fetchUser/rejected',
        payload: { status: 404 },
        meta: { arg: { endpointName: 'fetchUser' } },
      };

      middleware({ getState: mockGetState, dispatch: jest.fn() })(mockNext)(
        action
      );

      expect(mockLogger).toHaveBeenCalledWith(
        expect.stringContaining('fetchUser')
      );
      expect(mockNotificationHandler).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(action);
    });

    it('should handle actions with rejectedWithValue', () => {
      const action = {
        type: 'custom/action',
        payload: { message: 'Custom error' },
        meta: { rejectedWithValue: true },
      };

      middleware({ getState: mockGetState, dispatch: jest.fn() })(mockNext)(
        action
      );

      expect(mockLogger).toHaveBeenCalled();
      expect(mockNotificationHandler).toHaveBeenCalled();
    });

    it('should pass through non-rejected actions', () => {
      const action = { type: 'api/fetchUser/fulfilled', payload: { id: 1 } };

      middleware({ getState: mockGetState, dispatch: jest.fn() })(mockNext)(
        action
      );

      expect(mockLogger).not.toHaveBeenCalled();
      expect(mockNotificationHandler).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(action);
    });

    it('should use error property when payload is not available', () => {
      const action = {
        type: 'api/fetchUser/rejected',
        error: { message: 'Network error' },
      };

      middleware({ getState: mockGetState, dispatch: jest.fn() })(mockNext)(
        action
      );

      expect(mockLogger).toHaveBeenCalledWith(
        expect.stringContaining('Network error')
      );
    });

    it('should handle null action', () => {
      middleware({ getState: mockGetState, dispatch: jest.fn() })(mockNext)(
        null
      );

      expect(mockLogger).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(null);
    });

    it('should use "unknown" endpoint when meta is missing', () => {
      const action = { type: 'api/fetchUser/rejected', payload: {} };

      middleware({ getState: mockGetState, dispatch: jest.fn() })(mockNext)(
        action
      );

      expect(mockLogger).toHaveBeenCalledWith(
        expect.stringContaining('unknown')
      );
    });
  });

  describe('configuration options', () => {
    it('should skip handling when shouldHandle returns false', () => {
      const middleware = createRTKErrorMiddleware({
        logger: mockLogger,
        notificationHandler: mockNotificationHandler,
        shouldHandle: (action) =>
          !(action as { type: string }).type.includes('ignored'),
      });

      const action = { type: 'api/ignored/rejected', payload: {} };

      middleware({ getState: mockGetState, dispatch: jest.fn() })(mockNext)(
        action
      );

      expect(mockLogger).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(action);
    });

    it('should respect notify: false', () => {
      const middleware = createRTKErrorMiddleware({
        logger: mockLogger,
        notificationHandler: mockNotificationHandler,
        notify: false,
      });

      middleware({ getState: mockGetState, dispatch: jest.fn() })(mockNext)({
        type: 'api/test/rejected',
        payload: {},
      });

      expect(mockLogger).toHaveBeenCalled();
      expect(mockNotificationHandler).not.toHaveBeenCalled();
    });

    it('should respect log: false', () => {
      const middleware = createRTKErrorMiddleware({
        logger: mockLogger,
        notificationHandler: mockNotificationHandler,
        log: false,
      });

      middleware({ getState: mockGetState, dispatch: jest.fn() })(mockNext)({
        type: 'api/test/rejected',
        payload: {},
      });

      expect(mockLogger).not.toHaveBeenCalled();
      expect(mockNotificationHandler).toHaveBeenCalled();
    });

    it('should use custom defaultMessage', () => {
      const middleware = createRTKErrorMiddleware({
        logger: mockLogger,
        notificationHandler: mockNotificationHandler,
        defaultMessage: 'Custom message',
      });

      middleware({ getState: mockGetState, dispatch: jest.fn() })(mockNext)({
        type: 'api/test/rejected',
        payload: {},
      });

      expect(mockNotificationHandler).toHaveBeenCalledWith('Custom message');
    });
  });
});

describe('createReduxRTKErrorMiddleware', () => {
  let mockLogAction: jest.Mock;
  let mockNotifyAction: jest.Mock;
  let mockDispatch: jest.Mock;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockLogAction = jest.fn((payload) => ({ type: 'LOG', payload }));
    mockNotifyAction = jest.fn((message) => ({
      type: 'NOTIFY',
      payload: message,
    }));
    mockDispatch = jest.fn();
    mockNext = jest.fn((action) => action);
  });

  it('should dispatch actions on rejected action', () => {
    const middleware = createReduxRTKErrorMiddleware({
      logAction: mockLogAction,
      notifyAction: mockNotifyAction,
      defaultMessage: 'API failed',
    });

    const action = {
      type: 'api/fetchUser/rejected',
      payload: { status: 404 },
      meta: { arg: { endpointName: 'fetchUser' } },
    };

    middleware({ getState: jest.fn(), dispatch: mockDispatch })(mockNext)(
      action
    );

    expect(mockLogAction).toHaveBeenCalledWith({
      message: expect.stringContaining('fetchUser'),
      level: 'error',
    });
    expect(mockNotifyAction).toHaveBeenCalledWith('API failed');
    expect(mockDispatch).toHaveBeenCalledTimes(2);
  });

  it('should respect notify: false', () => {
    const middleware = createReduxRTKErrorMiddleware({
      logAction: mockLogAction,
      notifyAction: mockNotifyAction,
      notify: false,
    });

    middleware({ getState: jest.fn(), dispatch: mockDispatch })(mockNext)({
      type: 'api/test/rejected',
      payload: {},
    });

    expect(mockLogAction).toHaveBeenCalled();
    expect(mockNotifyAction).not.toHaveBeenCalled();
  });

  it('should respect log: false', () => {
    const middleware = createReduxRTKErrorMiddleware({
      logAction: mockLogAction,
      notifyAction: mockNotifyAction,
      log: false,
    });

    middleware({ getState: jest.fn(), dispatch: mockDispatch })(mockNext)({
      type: 'api/test/rejected',
      payload: {},
    });

    expect(mockLogAction).not.toHaveBeenCalled();
    expect(mockNotifyAction).toHaveBeenCalled();
  });

  it('should pass through non-rejected actions', () => {
    const middleware = createReduxRTKErrorMiddleware({
      logAction: mockLogAction,
      notifyAction: mockNotifyAction,
    });

    const action = { type: 'api/test/fulfilled', payload: {} };

    middleware({ getState: jest.fn(), dispatch: mockDispatch })(mockNext)(
      action
    );

    expect(mockDispatch).not.toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledWith(action);
  });
});
