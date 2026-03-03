# @open-kingdom/shared-frontend-feature-notifications

React UI feature library providing a Redux-connected toast notification container that reads from the `data-access-notifications` slice and renders animated toast messages using `ui-notifications` primitive components.

---

## Exports

| Export                       | Type       | Description                                                                                                                                      |
| ---------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `NotificationToastContainer` | `React.FC` | Connected container that renders all active notifications as positioned toasts; handles auto-dismiss timing and remove-after-animation lifecycle |
| `SharedFeatureNotifications` | `React.FC` | Thin wrapper around `NotificationToastContainer` — equivalent component, exported for convenience                                                |

---

## Setup

### Required: Store must contain the notifications reducer

```typescript
import { configureStore } from '@reduxjs/toolkit';
import { NotificationKey, notificationReducer } from '@open-kingdom/shared-frontend-data-access-notifications';

export const store = configureStore({
  reducer: {
    [NotificationKey]: notificationReducer, // 'notifications'
    // ... other reducers
  },
});
```

### Required: Tailwind config must include `ui-notifications` content

```javascript
// tailwind.config.js
const baseConfig = require('@open-kingdom/shared-frontend-ui-theme/tailwind.config.js');

module.exports = {
  presets: [baseConfig],
  content: [
    './src/**/*.{ts,tsx}',
    // Include ui-notifications component paths for Tailwind class scanning:
    '../../libs/shared/frontend/ui-notifications/src/**/*.{ts,tsx}',
    '../../libs/shared/frontend/feature-notifications/src/**/*.{ts,tsx}',
  ],
};
```

---

## Usage

### Mount in app root

Mount `NotificationToastContainer` (or `SharedFeatureNotifications`) once at the top-level layout — outside any page routing, so it persists across navigation:

```tsx
import { NotificationToastContainer } from '@open-kingdom/shared-frontend-feature-notifications';
import { Provider } from 'react-redux';
import { store } from './store';

function App() {
  return (
    <Provider store={store}>
      <YourRouterOrLayout />
      {/* Renders as fixed bottom-right overlay */}
      <NotificationToastContainer />
    </Provider>
  );
}
```

### Trigger notifications from anywhere in the app

```typescript
import { showSuccessNotification, showErrorNotification, showWarningNotification } from '@open-kingdom/shared-frontend-data-access-notifications';
import { useDispatch } from 'react-redux';

function SomeFeatureComponent() {
  const dispatch = useDispatch();

  async function handleSave() {
    try {
      await api.save(data);
      dispatch(showSuccessNotification('Saved successfully'));
    } catch {
      dispatch(showErrorNotification('Save failed. Please try again.'));
    }
  }
}
```

---

## Container Behavior

`NotificationToastContainer`:

- Reads `selectActiveNotifications` and `selectNotificationConfig` from Redux
- Auto-dismisses notifications after `config.dismissTimeout` (default: 5000ms) when `config.autoDismiss` is `true`
- After dismissing, waits 300ms before dispatching `removeNotification` to allow CSS exit animations to complete
- Renders in a fixed `div` positioned at the bottom-right of the viewport (`fixed bottom-4 right-4 z-50`) with `aria-live="polite"` for accessibility
- Returns `null` when there are no visible notifications (no empty DOM node)

---

## Rendered DOM Structure

The container renders a fixed, bottom-right positioned `div` with `aria-live="polite"` and `aria-label="Notifications"`. Inside it, each visible notification is wrapped in a `pointer-events-auto` element containing a `NotificationToast` with `role="alert"` and `aria-live="assertive"`. The outer container uses `pointer-events-none` so it does not block clicks on the page behind it.

---

## Testing

```bash
nx test shared-frontend-feature-notifications
```
