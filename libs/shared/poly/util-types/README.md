# @open-kingdom/shared-poly-util-types

Shared TypeScript type definitions used across both backend and frontend packages in the OpenKingdom monorepo. A pure type library — no runtime code is emitted; all exports are `interface`, `type`, or `const` enums.

---

## Exports

### Notification Types

| Export | Kind | Description |
|---|---|---|
| `NotificationEntry` | `interface` | Shape of a single notification entry in the notifications Redux slice |
| `NotificationState` | `interface` | Shape of the notifications Redux slice state |
| `NotificationConfig` | `interface` | Configuration options for notification behavior |
| `RootStateContaining<K, V>` | `type` | Generic helper for creating typed selector state shapes |

---

## Type Details

### `NotificationConfig`

| Property | Type | Required | Default | Description |
|---|---|---|---|---|
| `maxNotifications` | `number` | No | `5` | Max entries to keep in state; oldest are dropped |
| `autoDismiss` | `boolean` | No | `true` | Whether notifications auto-dismiss |
| `dismissTimeout` | `number` | No | `5000` | Auto-dismiss delay in milliseconds |

### `NotificationEntry`

| Property | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `string` | Yes | — | Unique identifier |
| `message` | `string` | Yes | — | Display message text |
| `type` | `'success' \| 'warning' \| 'error'` | Yes | — | Notification severity |
| `timestamp` | `number` | Yes | — | Unix timestamp in milliseconds |
| `dismissed` | `boolean` | No | — | True after dismiss is triggered (before removal) |

### `NotificationState`

| Property | Type | Required | Default | Description |
|---|---|---|---|---|
| `notifications` | `NotificationEntry[]` | Yes | — | Active notification entries |
| `config` | `NotificationConfig` | Yes | — | Slice configuration |

### `RootStateContaining<K, V>`

A generic intersection type that satisfies both a general index signature and a specific known key. It is typed as `{ [key: string]: unknown } & { [P in K]: V }`, where `K` is a string literal key and `V` is the expected value type at that key. Used to type Redux selectors without importing the full store.

---

## Usage

Always use type-only imports from this package:

```typescript
import type {
  NotificationEntry,
  NotificationState,
  NotificationConfig,
  RootStateContaining,
} from '@open-kingdom/shared-poly-util-types';
```

### Using `RootStateContaining` for typed selectors

`RootStateContaining<K, V>` produces an intersection type that satisfies both index signatures and a specific known key. Use it when writing selectors that need to type the Redux state without importing the store:

```typescript
import type { RootStateContaining } from '@open-kingdom/shared-poly-util-types';
import type { NotificationState } from '@open-kingdom/shared-poly-util-types';

export type RootStateContainingNotifications = RootStateContaining<
  'notifications',
  NotificationState
>;

// Selector:
export const selectNotificationsState = (
  state: RootStateContainingNotifications
) => state['notifications'];
```

### Using `NotificationEntry` in component props

```typescript
import type { NotificationEntry } from '@open-kingdom/shared-poly-util-types';

interface NotificationToastProps {
  notification: NotificationEntry;
  onDismissed: (id: string) => void;
  onRemoved: (id: string) => void;
}
```

---

## Testing

```bash
nx test shared-poly-util-types
```
