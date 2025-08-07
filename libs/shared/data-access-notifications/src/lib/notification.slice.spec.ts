import { showSuccessNotification } from './notification.actions';
import {
  addNotificationReducer,
  clearNotificationsReducer,
  dismissNotification,
  dismissNotificationReducer,
  removeNotification,
  removeNotificationReducer,
  updateConfig,
  updateConfigReducer,
} from './notification.slice';
import { NotificationEntry } from '@ynaa/shared-util-types';

describe('the notification slice', () => {
  it('queues notifications', () => {
    const state = {
      notifications: [],
      config: {
        maxNotifications: 5,
        autoDismiss: true,
        dismissTimeout: 5000,
      },
    };
    addNotificationReducer(state, showSuccessNotification('Test notification'));
    expect(state.notifications.length).toEqual(1);
  });

  it('limits the number of notifications', () => {
    const state = {
      notifications: [],
      config: {
        maxNotifications: 3,
        autoDismiss: true,
        dismissTimeout: 5000,
      },
    };
    addNotificationReducer(
      state,
      showSuccessNotification('Test notification 1')
    );
    addNotificationReducer(
      state,
      showSuccessNotification('Test notification 2')
    );
    addNotificationReducer(
      state,
      showSuccessNotification('Test notification 3')
    );
    addNotificationReducer(
      state,
      showSuccessNotification('Test notification 4')
    );
    expect(state.notifications.length).toEqual(3);
  });

  it('dismisses notifications', () => {
    const state = {
      notifications: [
        {
          id: '1',
          message: 'Test notification',
          type: 'success',
          timestamp: Date.now(),
          dismissed: false,
        },
      ] as NotificationEntry[],
      config: {
        maxNotifications: 3,
        autoDismiss: true,
        dismissTimeout: 5000,
      },
    };
    dismissNotificationReducer(
      state,
      dismissNotification(state.notifications[0].id)
    );
    expect(state.notifications[0].dismissed).toEqual(true);
  });

  it('removes notifications', () => {
    const state = {
      notifications: [
        {
          id: '1',
          message: 'Test notification',
          type: 'success',
          timestamp: Date.now(),
          dismissed: false,
        },
      ] as NotificationEntry[],
      config: {
        maxNotifications: 3,
        autoDismiss: true,
        dismissTimeout: 5000,
      },
    };
    removeNotificationReducer(
      state,
      removeNotification(state.notifications[0].id)
    );
    expect(state.notifications.length).toEqual(0);
  });

  it('clears notifications', () => {
    const state = {
      notifications: [
        {
          id: '1',
          message: 'Test notification',
          type: 'success',
          timestamp: Date.now(),
          dismissed: false,
        },
      ] as NotificationEntry[],
      config: {
        maxNotifications: 3,
        autoDismiss: true,
        dismissTimeout: 5000,
      },
    };
    clearNotificationsReducer(state);
    expect(state.notifications.length).toEqual(0);
  });

  it('updates the config', () => {
    const state = {
      notifications: [],
      config: {
        maxNotifications: 3,
        autoDismiss: true,
        dismissTimeout: 5000,
      },
    };
    updateConfigReducer(state, updateConfig({ maxNotifications: 5 }));
    expect(state.config.maxNotifications).toEqual(5);
  });
});
