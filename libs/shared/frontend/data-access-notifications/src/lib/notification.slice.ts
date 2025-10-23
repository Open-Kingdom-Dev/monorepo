import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  NotificationState,
  NotificationEntry,
  NotificationConfig,
} from '@open-kingdom/shared-poly-util-types';

const defaultConfig: NotificationConfig = {
  maxNotifications: 5,
  autoDismiss: true,
  dismissTimeout: 5000,
};

const initialState: NotificationState = {
  notifications: [],
  config: defaultConfig,
};

export const addNotificationReducer = (
  state: NotificationState,
  action: PayloadAction<Omit<NotificationEntry, 'id' | 'timestamp'>>
) => {
  const notification: NotificationEntry = {
    ...action.payload,
    id: Date.now().toString(),
    timestamp: Date.now(),
    dismissed: false,
  };

  // Add to the beginning of the array (newest first)
  state.notifications.unshift(notification);

  // Limit the number of notifications if configured
  if (
    state.config.maxNotifications &&
    state.notifications.length > state.config.maxNotifications
  ) {
    state.notifications = state.notifications.slice(
      0,
      state.config.maxNotifications
    );
  }
};

export const dismissNotificationReducer = (
  state: NotificationState,
  action: PayloadAction<string>
) => {
  const notification = state.notifications.find((n) => n.id === action.payload);
  if (notification) {
    notification.dismissed = true;
  }
};

export const removeNotificationReducer = (
  state: NotificationState,
  action: PayloadAction<string>
) => {
  state.notifications = state.notifications.filter(
    (n) => n.id !== action.payload
  );
};

export const clearNotificationsReducer = (state: NotificationState) => {
  state.notifications = [];
};

export const updateConfigReducer = (
  state: NotificationState,
  action: PayloadAction<Partial<NotificationConfig>>
) => {
  state.config = { ...state.config, ...action.payload };
};

export const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: addNotificationReducer,
    dismissNotification: dismissNotificationReducer,
    removeNotification: removeNotificationReducer,
    clearNotifications: clearNotificationsReducer,
    updateConfig: updateConfigReducer,
  },
});

export const {
  addNotification,
  dismissNotification,
  removeNotification,
  clearNotifications,
  updateConfig,
} = notificationSlice.actions;

export const notificationReducer = notificationSlice.reducer;
