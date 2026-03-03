# @open-kingdom/shared-frontend-data-access-notifications

Redux slice for managing UI notification state, providing action creators for adding, dismissing, removing, and clearing notifications, plus selectors for querying active and typed notification sets. Used as the data layer for `@open-kingdom/shared-frontend-feature-notifications`.

---

## Exports

### Slice

| Export | Type | Description |
|---|---|---|
| `notificationReducer` | `Reducer<NotificationState>` | Add to store under `NotificationKey` (`'notifications'`) |

### Action Creators (direct)

| Export | Type | Description |
|---|---|---|
| `addNotification` | `ActionCreator<Omit<NotificationEntry, 'id' \| 'timestamp' \| 'dismissed'>>` | Adds a new notification; `id`, `timestamp`, and `dismissed: false` are auto-generated |
| `dismissNotification` | `ActionCreator<string>` | Sets `dismissed: true` on a notification by `id` (keeps it in state for animation) |
| `removeNotification` | `ActionCreator<string>` | Removes a notification by `id` from state entirely |
| `clearNotifications` | `ActionCreator<void>` | Removes all notifications |
| `updateConfig` | `ActionCreator<Partial<NotificationConfig>>` | Updates notification behavior config (e.g., max count, auto-dismiss timeout) |

### Action Creators (convenience helpers)

| Export | Type | Description |
|---|---|---|
| `showSuccessNotification(message: string)` | `() => Action` | Dispatches `addNotification` with `type: 'success'` |
| `showWarningNotification(message: string)` | `() => Action` | Dispatches `addNotification` with `type: 'warning'` |
| `showErrorNotification(message: string)` | `() => Action` | Dispatches `addNotification` with `type: 'error'` |
| `showNotification(message, type)` | `(message: string, type: 'success' \| 'warning' \| 'error') => Action` | Generic convenience helper |

### Selectors

| Export | Type | Description |
|---|---|---|
| `NotificationKey` | `'notifications'` | Reducer path string constant |
| `selectNotificationsState` | `(state: RootStateContainingNotifications) => NotificationState` | Full slice state |
| `selectAllNotifications` | `(state) => NotificationEntry[]` | All notifications (newest first) |
| `selectActiveNotifications` | `(state) => NotificationEntry[]` | Non-dismissed notifications only |
| `selectNotificationsByType(type)` | `(type) => (state) => NotificationEntry[]` | All notifications of a given type |
| `selectActiveNotificationsByType(type)` | `(type) => (state) => NotificationEntry[]` | Active (non-dismissed) notifications of a given type |
| `selectNotificationCount` | `(state) => number` | Total count (all notifications) |
| `selectActiveNotificationCount` | `(state) => number` | Count of active (non-dismissed) notifications |
| `selectNotificationConfig` | `(state) => NotificationConfig` | Current configuration |
| `RootStateContainingNotifications` | `type` | `{ [key: string]: unknown } & { notifications: NotificationState }` |

---

## Type Definitions

Types for `NotificationEntry`, `NotificationState`, `NotificationConfig`, and `RootStateContaining` are defined in `@open-kingdom/shared-poly-util-types`.

### `NotificationConfig`

| Property | Type | Required | Default | Description |
|---|---|---|---|---|
| `maxNotifications` | `number` | No | `5` | Oldest entries beyond this limit are dropped when new ones arrive |
| `autoDismiss` | `boolean` | No | `true` | Whether notifications are automatically dismissed after `dismissTimeout` |
| `dismissTimeout` | `number` | No | `5000` | Time in milliseconds before a notification is auto-dismissed |

### `NotificationEntry`

| Property | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `string` | Yes (auto) | Auto-generated from `Date.now().toString()` | Unique identifier |
| `message` | `string` | Yes | — | The notification text |
| `type` | `'success' \| 'warning' \| 'error'` | Yes | — | Visual type of the notification |
| `timestamp` | `number` | Yes (auto) | Auto-generated from `Date.now()` | Unix millisecond timestamp |
| `dismissed` | `boolean` | No | `false` | Whether the notification has been dismissed |

### `NotificationState`

| Property | Type | Description |
|---|---|---|
| `notifications` | `NotificationEntry[]` | All notification entries, newest first |
| `config` | `NotificationConfig` | Current notification behavior configuration |

---

## Setup

### Store Registration

```typescript
import { configureStore } from '@reduxjs/toolkit';
import {
  NotificationKey,
  notificationReducer,
} from '@open-kingdom/shared-frontend-data-access-notifications';

export const store = configureStore({
  reducer: {
    [NotificationKey]: notificationReducer, // 'notifications'
  },
});
```

---

## Usage Examples

### Show notifications

```typescript
import {
  showSuccessNotification,
  showWarningNotification,
  showErrorNotification,
  showNotification,
} from '@open-kingdom/shared-frontend-data-access-notifications';
import { useDispatch } from 'react-redux';

function MyComponent() {
  const dispatch = useDispatch();

  const handleSave = async () => {
    try {
      await save();
      dispatch(showSuccessNotification('Changes saved successfully'));
    } catch {
      dispatch(showErrorNotification('Failed to save changes'));
    }
  };

  const handleWarning = () => {
    dispatch(showWarningNotification('Session expiring soon'));
  };

  // Generic helper:
  dispatch(showNotification('Custom message', 'success'));
}
```

### Add notification with raw action creator

```typescript
import { addNotification } from '@open-kingdom/shared-frontend-data-access-notifications';

// addNotification accepts: Omit<NotificationEntry, 'id' | 'timestamp' | 'dismissed'>
dispatch(addNotification({ message: 'File uploaded', type: 'success' }));
```

### Dismiss and remove notifications

```typescript
import {
  dismissNotification,
  removeNotification,
  clearNotifications,
} from '@open-kingdom/shared-frontend-data-access-notifications';

// Mark as dismissed (allows animation to complete before removal):
dispatch(dismissNotification(notificationId));

// Remove entirely from state:
dispatch(removeNotification(notificationId));

// Clear all:
dispatch(clearNotifications());
```

### Update configuration at runtime

```typescript
import { updateConfig } from '@open-kingdom/shared-frontend-data-access-notifications';

dispatch(updateConfig({
  maxNotifications: 3,
  autoDismiss: true,
  dismissTimeout: 3000,
}));
```

### Query notification state

```typescript
import {
  selectActiveNotifications,
  selectNotificationCount,
  selectActiveNotificationsByType,
} from '@open-kingdom/shared-frontend-data-access-notifications';
import { useSelector } from 'react-redux';

function NotificationBadge() {
  const count = useSelector(selectActiveNotificationCount);
  const errors = useSelector(selectActiveNotificationsByType('error'));
  return <span>{count} active ({errors.length} errors)</span>;
}
```

---

## State Behavior

- New notifications are prepended (newest first) — index `0` is always the most recent
- When `notifications.length > config.maxNotifications`, the oldest entries are sliced off
- `dismissNotification` sets `dismissed: true` but keeps the entry in state — this enables CSS exit animations
- `removeNotification` fully removes the entry from state
- `clearNotifications` empties the array entirely (does not reset `config`)

---

## Testing

```bash
nx test shared-frontend-data-access-notifications
```
