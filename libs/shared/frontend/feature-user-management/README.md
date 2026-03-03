# @open-kingdom/shared-frontend-feature-user-management

React UI feature library for user and invitation management, providing admin-facing pages and components for viewing users in a data grid, inviting new users, managing the invitation list, cancelling invitations, accepting invitations, and role display.

---

## Exports

| Export             | Type                        | Description                                                                                                                      |
| ------------------ | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `UserList`         | `React.FC<UserListProps>`   | Admin user table with invite and delete actions, rendered in a `DataGrid`                                                        |
| `AcceptInvitation` | `React.FC`                  | Page component for accepting an invitation via token (used at public invitation URL)                                             |
| `InvitationList`   | `React.FC`                  | Admin list of pending/expired invitations with cancel action                                                                     |
| `StatusCard`       | `React.FC<StatusCardProps>` | Shared status display card (success/error states)                                                                                |
| `User`             | `interface`                 | `{ id: number; email: string; firstName: string \| null; lastName: string \| null; role: Role }`                                 |
| `Role`             | `type`                      | `'guest' \| 'user' \| 'admin'`                                                                                                   |
| `Invitation`       | `interface`                 | `{ id: number; email: string; tokenExpiry: number; invitedBy: number; invitedAt: number; role: Role; status: InvitationStatus }` |
| `InvitationStatus` | `type`                      | `'pending' \| 'accepted' \| 'expired'`                                                                                           |

---

## Type Definitions

### `User`

| Property    | Type             | Required | Description                             |
| ----------- | ---------------- | -------- | --------------------------------------- |
| `id`        | `number`         | Yes      | Unique user identifier                  |
| `email`     | `string`         | Yes      | User's email address                    |
| `firstName` | `string \| null` | Yes      | User's first name, or `null` if not set |
| `lastName`  | `string \| null` | Yes      | User's last name, or `null` if not set  |
| `role`      | `Role`           | Yes      | The user's assigned role                |

`Role` is one of `'guest'`, `'user'`, or `'admin'`.

### `Invitation`

| Property      | Type               | Required | Description                                                  |
| ------------- | ------------------ | -------- | ------------------------------------------------------------ |
| `id`          | `number`           | Yes      | Unique invitation identifier                                 |
| `email`       | `string`           | Yes      | Email address the invitation was sent to                     |
| `tokenExpiry` | `number`           | Yes      | Unix millisecond timestamp when the invitation token expires |
| `invitedBy`   | `number`           | Yes      | `User.id` of the admin who sent the invitation               |
| `invitedAt`   | `number`           | Yes      | Unix millisecond timestamp when the invitation was created   |
| `role`        | `Role`             | Yes      | Role that will be assigned upon acceptance                   |
| `status`      | `InvitationStatus` | Yes      | Current state of the invitation                              |

`InvitationStatus` is one of `'pending'`, `'accepted'`, or `'expired'`.

---

## Component Props

### `UserList`

| Property        | Type     | Required | Default | Description                                               |
| --------------- | -------- | -------- | ------- | --------------------------------------------------------- |
| `currentUserId` | `number` | No       | —       | Prevents the current user from deleting their own account |

`UserList` fetches users via the `useUsersControllerFindAllQuery()` hook and deletes them via `useUsersControllerDeleteMutation()` (both RTK Query hooks auto-generated from OpenAPI). It dispatches `showSuccessNotification` after a successful delete. Users are rendered in a `DataGrid` with columns for Email, Name (computed from first and last name), Role (displayed as a badge), and Actions (a delete button). An "Invite User" button opens an `InviteUserModal`, and a `ConfirmDialog` is shown before each delete.

### `StatusCard`

Used internally by `AcceptInvitation` to render success or error outcomes.

---

## Setup

All required Redux slices and RTK Query middleware must be registered in the store:

```typescript
import { configureStore } from '@reduxjs/toolkit';
import { ApiKey, apiReducer, apiMiddleware, AuthKey, authReducer } from '@open-kingdom/shared-frontend-data-access-api-client';
import { NotificationKey, notificationReducer } from '@open-kingdom/shared-frontend-data-access-notifications';

export const store = configureStore({
  reducer: {
    [ApiKey]: apiReducer,
    [AuthKey]: authReducer,
    [NotificationKey]: notificationReducer,
  },
  middleware: (getDefault) => getDefault().concat(apiMiddleware),
});
```

---

## Usage Examples

### Admin user management page

```tsx
import { UserList } from '@open-kingdom/shared-frontend-feature-user-management';
import { useSelector } from 'react-redux';
import { selectUser } from '@open-kingdom/shared-frontend-data-access-api-client';

function AdminUsersPage() {
  const currentUser = useSelector(selectToken); // or read from your auth state
  return (
    <div className="p-6">
      <UserList currentUserId={currentUser?.id} />
    </div>
  );
}
```

### Invitation list page

```tsx
import { InvitationList } from '@open-kingdom/shared-frontend-feature-user-management';

function AdminInvitationsPage() {
  return (
    <div className="p-6">
      <InvitationList />
    </div>
  );
}
```

### Accept invitation page (public route)

```tsx
import { AcceptInvitation } from '@open-kingdom/shared-frontend-feature-user-management';

// Mount at the invitation acceptance URL, e.g. /invitations/accept?token=<jwt>
function AcceptInvitationPage() {
  return <AcceptInvitation />;
}
```

---

## Testing

```bash
nx test shared-frontend-feature-user-management
```
