import {
  selectActiveNotifications,
  selectActiveNotificationsByType,
  selectAllNotifications,
  selectNotificationConfig,
  selectNotificationCount,
  selectNotificationsByType,
  selectNotificationsState,
} from './notification.selectors';

describe('the notifications data access library', () => {
  it('provide access to the notification state', () => {
    const state = {
      notifications: {
        notifications: [],
        config: {
          maxNotifications: 5,
          autoDismiss: true,
          dismissTimeout: 5000,
        },
      },
    };
    const result = selectNotificationsState(state);
    expect(result).toEqual(state.notifications);
  });

  it('provides access to the list of notifications', () => {
    const state = {
      notifications: {
        notifications: [],
        config: {
          maxNotifications: 5,
          autoDismiss: true,
          dismissTimeout: 5000,
        },
      },
    };
    const result = selectAllNotifications(state);
    expect(result).toEqual(state.notifications.notifications);
  });

  it('provides access to the list of active notifications', () => {
    const state = {
      notifications: {
        notifications: [],
        config: {
          maxNotifications: 5,
          autoDismiss: true,
          dismissTimeout: 5000,
        },
      },
    };
    const result = selectActiveNotifications(state);
    expect(result).toEqual(state.notifications.notifications);
  });

  it('provides access to the list of notifications by type', () => {
    const state = {
      notifications: {
        notifications: [],
        config: {
          maxNotifications: 5,
          autoDismiss: true,
          dismissTimeout: 5000,
        },
      },
    };
    const result = selectNotificationsByType('success')(state);
    expect(result).toEqual(state.notifications.notifications);
  });

  it('provides access to the list of active notifications by type', () => {
    const state = {
      notifications: {
        notifications: [],
        config: {
          maxNotifications: 5,
          autoDismiss: true,
          dismissTimeout: 5000,
        },
      },
    };
    const result = selectActiveNotificationsByType('success')(state);
    expect(result).toEqual(state.notifications.notifications);
  });

  it('provides access to the configuration', () => {
    const state = {
      notifications: {
        notifications: [],
        config: {
          maxNotifications: 5,
          autoDismiss: true,
          dismissTimeout: 5000,
        },
      },
    };
    const result = selectNotificationConfig(state);
    expect(result).toEqual(state.notifications.config);
  });

  it('provides access to the notification count', () => {
    const state = {
      notifications: {
        notifications: [],
        config: {
          maxNotifications: 5,
          autoDismiss: true,
          dismissTimeout: 5000,
        },
      },
    };
    const result = selectNotificationCount(state);
    expect(result).toEqual(state.notifications.notifications.length);
  });
});
