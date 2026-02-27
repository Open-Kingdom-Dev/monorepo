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

  it('can be created without any configuration', () => {
    const middleware = createRTKErrorMiddleware();
    expect(typeof middleware).toBe('function');
  });

  describe('when an API request fails', () => {
    let middleware: Middleware;

    beforeEach(() => {
      middleware = createRTKErrorMiddleware({
        logger: mockLogger,
        notificationHandler: mockNotificationHandler,
      });
    });

    it('logs the error and notifies the user', () => {
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

    it('notifies the user when the server explicitly rejects a request', () => {
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

    it('does not interfere with successful requests', () => {
      const action = { type: 'api/fetchUser/fulfilled', payload: { id: 1 } };

      middleware({ getState: mockGetState, dispatch: jest.fn() })(mockNext)(
        action
      );

      expect(mockLogger).not.toHaveBeenCalled();
      expect(mockNotificationHandler).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(action);
    });

    it('shows network error details to the user', () => {
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

    it('safely ignores actions that are not API responses', () => {
      middleware({ getState: mockGetState, dispatch: jest.fn() })(mockNext)(
        null
      );

      expect(mockLogger).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(null);
    });

    it('labels the error as from an unknown source when the origin is unclear', () => {
      const action = { type: 'api/fetchUser/rejected', payload: {} };

      middleware({ getState: mockGetState, dispatch: jest.fn() })(mockNext)(
        action
      );

      expect(mockLogger).toHaveBeenCalledWith(
        expect.stringContaining('unknown')
      );
    });
  });

  describe('customizing behavior', () => {
    it('can be configured to ignore specific errors', () => {
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

    it('can log errors without showing notifications to the user', () => {
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

    it('can show notifications without logging', () => {
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

    it('shows the server error message to the user', () => {
      const middleware = createRTKErrorMiddleware({
        logger: mockLogger,
        notificationHandler: mockNotificationHandler,
      });

      middleware({ getState: mockGetState, dispatch: jest.fn() })(mockNext)({
        type: 'api/test/rejected',
        payload: { status: 400, data: { message: 'Validation failed' } },
        meta: { arg: { endpointName: 'test' } },
      });

      expect(mockNotificationHandler).toHaveBeenCalledWith('Validation failed');
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

  it('logs the failure and notifies the user when a request is rejected', () => {
    const middleware = createReduxRTKErrorMiddleware({
      logAction: mockLogAction,
      notifyAction: mockNotifyAction,
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
    expect(mockNotifyAction).toHaveBeenCalledWith(
      'Request failed with status 404'
    );
    expect(mockDispatch).toHaveBeenCalledTimes(2);
  });

  it('shows the admin the exact error message from the server', () => {
    const middleware = createReduxRTKErrorMiddleware({
      logAction: mockLogAction,
      notifyAction: mockNotifyAction,
    });

    const action = {
      type: 'api/invitationsControllerInvite/rejected',
      payload: {
        status: 502,
        data: {
          message: 'Invitation could not be sent — email delivery failed',
        },
      },
      meta: { arg: { endpointName: 'invitationsControllerInvite' } },
    };

    middleware({ getState: jest.fn(), dispatch: mockDispatch })(mockNext)(
      action
    );

    expect(mockNotifyAction).toHaveBeenCalledWith(
      'Invitation could not be sent — email delivery failed'
    );
  });

  it('can log errors without notifying the user', () => {
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

  it('can notify the user without logging', () => {
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

  it('does not interfere with successful requests', () => {
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
