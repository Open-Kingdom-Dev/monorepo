# @open-kingdom/shared-frontend-ui-notifications

Primitive React UI notification component (`NotificationToast`) that renders a single notification entry with type-specific styling, an animated enter/exit transition, and a dismiss button. Used as the rendering layer by `@open-kingdom/shared-frontend-feature-notifications`.

---

## Exports

| Export | Type | Description |
|---|---|---|
| `NotificationToast` | `React.FC<NotificationToastProps>` | Renders a single toast notification with type styling and dismiss behavior |

---

## Type Definitions

### `NotificationToastProps`

| Property | Type | Required | Description |
|---|---|---|---|
| `notification` | `NotificationEntry` | Yes | The notification entry to render (from `@open-kingdom/shared-poly-util-types`) |
| `onDismissed` | `(id: string) => void` | Yes | Called immediately when the user clicks dismiss or auto-dismiss fires |
| `onRemoved` | `(id: string) => void` | Yes | Called after the 300ms exit animation delay, signalling safe removal from state |

### `NotificationEntry` (from `@open-kingdom/shared-poly-util-types`)

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | Unique identifier |
| `message` | `string` | Yes | The notification text |
| `type` | `'success' \| 'warning' \| 'error'` | Yes | Controls icon and color styling |
| `timestamp` | `number` | Yes | Unix millisecond timestamp |
| `dismissed` | `boolean` | No | When `true`, triggers the exit animation |

---

## Usage

### Direct usage (without Redux)

```tsx
import { NotificationToast } from '@open-kingdom/shared-frontend-ui-notifications';
import type { NotificationEntry } from '@open-kingdom/shared-poly-util-types';

const notification: NotificationEntry = {
  id: '1',
  message: 'File uploaded successfully',
  type: 'success',
  timestamp: Date.now(),
};

function CustomNotificationContainer() {
  const handleDismissed = (id: string) => {
    // Called immediately on dismiss — update your state to mark dismissed
    console.log('Dismissed:', id);
  };

  const handleRemoved = (id: string) => {
    // Called after 300ms (exit animation) — remove from state
    console.log('Removed:', id);
  };

  return (
    <NotificationToast
      notification={notification}
      onDismissed={handleDismissed}
      onRemoved={handleRemoved}
    />
  );
}
```

### In a positioned container (mirrors feature-notifications layout)

```tsx
import { NotificationToast } from '@open-kingdom/shared-frontend-ui-notifications';

function NotificationStack({ notifications, onDismiss, onRemove }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 pointer-events-none">
      {notifications.map((n) => (
        <div key={n.id} className="pointer-events-auto">
          <NotificationToast
            notification={n}
            onDismissed={onDismiss}
            onRemoved={onRemove}
          />
        </div>
      ))}
    </div>
  );
}
```

---

## Component Behavior

- Animates in with a slide-right + fade-in transition on mount (10ms delay to trigger CSS transition)
- Animates out with slide-right + fade-out when `dismissed` is triggered (manually or by parent)
- Calls `onDismissed(id)` immediately when the dismiss button is clicked
- Calls `onRemoved(id)` after 300ms to allow exit animation to complete
- Width: `min-w-[320px] max-w-[480px] w-full`
- `role="alert"` and `aria-live="assertive"` for accessibility

## Type-Specific Styling

| Type | Background | Border | Icon |
|---|---|---|---|
| `'success'` | `bg-success-50 dark:bg-success-900/20` | `border-success-200 dark:border-success-700` | Checkmark SVG |
| `'warning'` | `bg-warning-50 dark:bg-warning-900/20` | `border-warning-200 dark:border-warning-700` | Triangle/alert SVG |
| `'error'` | `bg-error-50 dark:bg-error-900/20` | `border-error-200 dark:border-error-700` | Circle/X SVG |

All color classes reference CSS variables from `@open-kingdom/shared-frontend-ui-theme`. The Tailwind config used by the consuming application must include the `ui-theme` preset so these classes are generated.

---

## Required Tailwind Configuration

```javascript
// tailwind.config.js in the consuming app or library
const baseConfig = require('@open-kingdom/shared-frontend-ui-theme/tailwind.config.js');

module.exports = {
  presets: [baseConfig],
  content: [
    './src/**/*.{ts,tsx}',
    '../../libs/shared/frontend/ui-notifications/src/**/*.{ts,tsx}',
  ],
};
```

---

## Testing

```bash
nx test shared-frontend-ui-notifications
```
