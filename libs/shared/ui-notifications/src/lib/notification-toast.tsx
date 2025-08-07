import { useEffect, useState } from 'react';

import { NotificationEntry } from '@ynaa/shared-util-types';

interface NotificationToastProps {
  notification: NotificationEntry;
  onDismissed: (id: string) => void;
  onRemoved: (id: string) => void;
}

export function NotificationToast({
  notification,
  onDismissed,
  onRemoved,
}: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Animate in on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsExiting(true);
    // Notify consumer of dismissed event
    onDismissed(notification.id);

    // Remove from DOM after animation
    setTimeout(() => {
      // Notify consumer of removed event
      onRemoved(notification.id);
    }, 300);
  };

  const getNotificationStyles = (type: 'success' | 'warning' | 'error') => {
    const baseStyles =
      'p-4 rounded-lg border shadow-lg transition-all duration-300 ease-in-out transform';

    switch (type) {
      case 'success':
        return `${baseStyles} bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-700`;
      case 'warning':
        return `${baseStyles} bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-700`;
      case 'error':
        return `${baseStyles} bg-error-50 dark:bg-error-900/20 border-error-200 dark:border-error-700`;
      default:
        return baseStyles;
    }
  };

  const getNotificationTextStyles = (type: 'success' | 'warning' | 'error') => {
    switch (type) {
      case 'success':
        return 'text-success-800 dark:text-success-200';
      case 'warning':
        return 'text-warning-800 dark:text-warning-200';
      case 'error':
        return 'text-error-800 dark:text-error-200';
      default:
        return '';
    }
  };

  const getNotificationContentStyles = (
    type: 'success' | 'warning' | 'error'
  ) => {
    switch (type) {
      case 'success':
        return 'text-success-600 dark:text-success-400';
      case 'warning':
        return 'text-warning-600 dark:text-warning-400';
      case 'error':
        return 'text-error-600 dark:text-error-400';
      default:
        return '';
    }
  };

  const getIcon = (type: 'success' | 'warning' | 'error') => {
    switch (type) {
      case 'success':
        return (
          <svg
            className="w-5 h-5 text-success-600 dark:text-success-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        );
      case 'warning':
        return (
          <svg
            className="w-5 h-5 text-warning-600 dark:text-warning-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        );
      case 'error':
        return (
          <svg
            className="w-5 h-5 text-error-600 dark:text-error-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`
        ${getNotificationStyles(notification.type)}
        ${
          isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }
        ${isExiting ? 'translate-x-full opacity-0' : ''}
        min-w-[320px] max-w-[480px] w-full
      `}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{getIcon(notification.type)}</div>
        <div className="flex-1 min-w-0">
          <h4
            className={`text-sm font-semibold ${getNotificationTextStyles(
              notification.type
            )}`}
          >
            {notification.type.charAt(0).toUpperCase() +
              notification.type.slice(1)}
          </h4>
          <p
            data-testid="notification"
            className={`text-sm mt-1 ${getNotificationContentStyles(
              notification.type
            )}`}
          >
            {notification.message}
          </p>
        </div>
        <button
          data-testid="dismiss-button"
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
          aria-label="Dismiss notification"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
