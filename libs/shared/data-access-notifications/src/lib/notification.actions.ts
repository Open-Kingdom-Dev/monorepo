import {
  addNotification,
  dismissNotification,
  removeNotification,
  clearNotifications,
  updateConfig,
} from './notification.slice';

// Re-export actions for convenience
export {
  addNotification,
  dismissNotification,
  removeNotification,
  clearNotifications,
  updateConfig,
};

// Helper action creators for different notification types
export const showSuccessNotification = (message: string) =>
  addNotification({ message, type: 'success' });

export const showWarningNotification = (message: string) =>
  addNotification({ message, type: 'warning' });

export const showErrorNotification = (message: string) =>
  addNotification({ message, type: 'error' });

// Convenience function to show any type of notification
export const showNotification = (
  message: string,
  type: 'success' | 'warning' | 'error'
) => addNotification({ message, type });
