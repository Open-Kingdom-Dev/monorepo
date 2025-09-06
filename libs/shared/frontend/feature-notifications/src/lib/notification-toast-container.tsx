import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useState } from 'react';

import {
  selectActiveNotifications,
  selectNotificationConfig,
  dismissNotification,
  removeNotification,
} from '@ynaa/shared-frontend-data-access-notifications';
import { NotificationToast } from '@ynaa/shared-frontend-ui-notifications';

export function NotificationToastContainer() {
  const notifications = useSelector(selectActiveNotifications);
  const config = useSelector(selectNotificationConfig);
  const dispatch = useDispatch();
  const [visibleNotifications, setVisibleNotifications] = useState<string[]>(
    []
  );

  // Auto-dismiss notifications if configured
  useEffect(() => {
    if (!config.autoDismiss || !config.dismissTimeout) return;

    const timeouts: NodeJS.Timeout[] = [];

    notifications.forEach((notification) => {
      const timeout = setTimeout(() => {
        dispatch(dismissNotification(notification.id));
        // Remove from state after a brief delay to allow for animation
        setTimeout(() => {
          dispatch(removeNotification(notification.id));
        }, 300);
      }, config.dismissTimeout);

      timeouts.push(timeout);
    });

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [notifications, config.autoDismiss, config.dismissTimeout, dispatch]);

  // Update visible notifications when notifications change
  useEffect(() => {
    const notificationIds = notifications.map((n) => n.id);
    setVisibleNotifications((prev) => {
      const newVisible = [...prev];

      // Add new notifications
      notificationIds.forEach((id) => {
        if (!newVisible.includes(id)) {
          newVisible.push(id);
        }
      });

      return newVisible;
    });
  }, [notifications]);

  const handleDismissed = (id: string) => {
    dispatch(dismissNotification(id));
  };

  const handleRemoved = (id: string) => {
    dispatch(removeNotification(id));
    setVisibleNotifications((prev) =>
      prev.filter((notificationId) => notificationId !== id)
    );
  };

  const visibleNotificationData = notifications.filter((n) =>
    visibleNotifications.includes(n.id)
  );

  if (visibleNotificationData.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 pointer-events-none"
      aria-live="polite"
      aria-label="Notifications"
    >
      {visibleNotificationData.map((notification) => (
        <div key={notification.id} className="pointer-events-auto">
          <NotificationToast
            notification={notification}
            onDismissed={handleDismissed}
            onRemoved={handleRemoved}
          />
        </div>
      ))}
    </div>
  );
}
