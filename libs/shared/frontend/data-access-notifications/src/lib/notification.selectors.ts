import { createSelector } from '@reduxjs/toolkit';
import {
  NotificationState,
  RootStateContaining,
} from '@ynaa/shared-poly-util-types';

export const NotificationKey = 'notifications';
export type RootStateContainingNotifications = RootStateContaining<
  typeof NotificationKey,
  NotificationState
>;

export const selectNotificationsState = (
  state: RootStateContainingNotifications
) => state[NotificationKey];

// Selector to get all notifications
export const selectAllNotifications = createSelector(
  [selectNotificationsState],
  (notificationsState) => notificationsState.notifications
);

// Selector to get active (non-dismissed) notifications
export const selectActiveNotifications = createSelector(
  [selectAllNotifications],
  (notifications) => notifications.filter((n) => !n.dismissed)
);

// Selector to get notifications by type
export const selectNotificationsByType = (
  type: 'success' | 'warning' | 'error'
) =>
  createSelector([selectAllNotifications], (notifications) =>
    notifications.filter((n) => n.type === type)
  );

// Selector to get active notifications by type
export const selectActiveNotificationsByType = (
  type: 'success' | 'warning' | 'error'
) =>
  createSelector([selectActiveNotifications], (notifications) =>
    notifications.filter((n) => n.type === type)
  );

// Selector to get notification count
export const selectNotificationCount = createSelector(
  [selectAllNotifications],
  (notifications) => notifications.length
);

// Selector to get active notification count
export const selectActiveNotificationCount = createSelector(
  [selectActiveNotifications],
  (notifications) => notifications.length
);

// Selector to get notification configuration
export const selectNotificationConfig = createSelector(
  [selectNotificationsState],
  (notificationsState) => notificationsState.config
);
