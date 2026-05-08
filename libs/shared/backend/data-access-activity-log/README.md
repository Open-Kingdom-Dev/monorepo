# `@open-kingdom/shared-backend-data-access-activity-log`

A NestJS module providing a polymorphic activity log — log any kind of activity (note, call, task, status-change, comment, …) against any kind of related record (contact, lead, project, ticket, …). Each entry has an owner, an optional due date, and an optional completion timestamp; completing an activity can append outcome notes to the existing description.

This library is **domain-agnostic**. The schema is fully generic — `(related_type, related_id, type, subject, description, due_at, completed_at, owner_id)` — and the host application supplies the vocabularies for `related_type` and `type` at module registration time via `forRoot({ allowedRelatedTypes, allowedActivityTypes })`. Unknown values are rejected with `BadRequestException`. When no allowed-types lists are supplied, any non-empty string is accepted (useful for tests).

---

## Exports

| Export                                                                                                         | Kind                     | Description                                                                                                                                                                                                                 |
| -------------------------------------------------------------------------------------------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DataAccessActivityLogModule`                                                                                  | `class`                  | Dynamic NestJS module. Use `forRoot({ allowedRelatedTypes?, allowedActivityTypes? })` to constrain the accepted vocabulary; the bare module accepts any non-empty string.                                                   |
| `DataAccessActivityLogOptions`                                                                                 | `interface`              | `{ allowedRelatedTypes?, allowedActivityTypes?: ReadonlyArray<string> }`. Both lists optional.                                                                                                                              |
| `ACTIVITY_LOG_OPTIONS`                                                                                         | `'ACTIVITY_LOG_OPTIONS'` | DI token for the options object.                                                                                                                                                                                            |
| `ActivityLogService`                                                                                           | `class`                  | Injectable service for activity CRUD, completion, and per-owner / per-record queries. Exposes `isAllowedRelatedType(value)` and `isAllowedActivityType(value)` for callers that need to validate before calling `create()`. |
| `ActivityLogController`                                                                                        | `class`                  | REST controller mounted at `/activities`.                                                                                                                                                                                   |
| `activityLog`                                                                                                  | `BetterSQLite3Table`     | Drizzle table.                                                                                                                                                                                                              |
| `ActivityLogTableName`                                                                                         | `'activity_log'`         | String constant.                                                                                                                                                                                                            |
| `ActivityLogEntry` / `NewActivityLogEntry`                                                                     | `type`                   | Inferred select/insert types.                                                                                                                                                                                               |
| `ActivityLogEntryDto`, `CreateActivityLogEntryDto`, `UpdateActivityLogEntryDto`, `CompleteActivityLogEntryDto` | `class`                  | Swagger DTOs. `relatedType` and `type` are typed as `string` — runtime values constrained via `forRoot()`.                                                                                                                  |

---

## Drizzle Schema

### `activity_log` Table

| Column         | Type                | Constraints                 | Description                                                                                                          |
| -------------- | ------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `id`           | `integer`           | Primary key, auto-increment |                                                                                                                      |
| `related_type` | `text`              | Not null                    | Polymorphic record kind. Validated at write time against `allowedRelatedTypes` (when supplied via `forRoot()`).      |
| `related_id`   | `integer`           | Not null                    | Primary key of the row in the related table. **No foreign key** — kept as a soft reference because the table varies. |
| `type`         | `text`              | Not null                    | Activity kind. Validated at write time against `allowedActivityTypes` (when supplied via `forRoot()`).               |
| `subject`      | `text`              | Not null                    | Short headline rendered in lists.                                                                                    |
| `description`  | `text`              | Nullable                    | Long-form body. `complete()` may append outcome notes to this field.                                                 |
| `due_at`       | `integer` timestamp | Nullable                    | Meaningful for `task`, `call`, `meeting` (per `supportsDueDate()` in `crm-poly-util-domain`).                        |
| `completed_at` | `integer` timestamp | Nullable                    | Set by `complete()`. `null` means open.                                                                              |
| `owner_id`     | `integer`           | Not null, FK → `users.id`   |                                                                                                                      |
| `created_at`   | `integer` timestamp | Not null, default now       |                                                                                                                      |
| `updated_at`   | `integer` timestamp | Not null, default now       | Bumped on every write.                                                                                               |

Indexes: `activity_log_related_idx` (`related_type`, `related_id`), `activity_log_owner_idx` (`owner_id`), `activity_log_due_idx` (`due_at`).

---

## Module Registration

Dynamic module. The recommended form is `forRoot()` with the host's allowed-types vocabularies.

```typescript
import { DataAccessActivityLogModule } from '@open-kingdom/shared-backend-data-access-activity-log';
import { ACTIVITY_TYPES, RELATED_ENTITY_TYPES } from '@open-kingdom/crm-poly-util-domain';

@Module({
  imports: [
    DataAccessActivityLogModule.forRoot({
      allowedRelatedTypes: RELATED_ENTITY_TYPES,
      allowedActivityTypes: ACTIVITY_TYPES,
    }),
  ],
})
export class SomeFeatureModule {}
```

Importing the bare module (no `forRoot()`) is supported and accepts any non-empty string — useful for tests and for hosts that haven't yet decided on a fixed vocabulary.

Add the table to the root schema composition:

```typescript
import { activityLog } from '@open-kingdom/shared-backend-data-access-activity-log';

const schema = {
  // …
  activityLog,
};
```

---

## Configuration

| Option                 | Type                    | Default                     | Description                                                                                                            |
| ---------------------- | ----------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `allowedRelatedTypes`  | `ReadonlyArray<string>` | `null` (any value accepted) | Whitelist of acceptable values for `related_type`. Unknown values rejected with `BadRequestException` from `create()`. |
| `allowedActivityTypes` | `ReadonlyArray<string>` | `null` (any value accepted) | Whitelist of acceptable values for `type`. Unknown values rejected with `BadRequestException` from `create()`.         |

The `GET /activities?relatedType=…&relatedId=…` endpoint also validates `relatedType` against the same list (rejecting with `ForbiddenException`) — querying by an unknown vocabulary is treated as an attempt to enumerate something the host hasn't permitted.

Database access resolves via the global `DB_TAG` token; no DI plumbing required.

---

## ActivityLogService API

```typescript
constructor(private activities: ActivityLogService) {}
```

| Method                  | Parameters                                          | Returns                                  | Description                                                                                                                    |
| ----------------------- | --------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `isAllowedRelatedType`  | `value: string`                                     | `boolean`                                | `true` if `value` is in the configured `allowedRelatedTypes` list, or if no list was configured.                               |
| `isAllowedActivityType` | `value: string`                                     | `boolean`                                | `true` if `value` is in the configured `allowedActivityTypes` list, or if no list was configured.                              |
| `findForRecord`         | `relatedType: string, relatedId: number`            | `Promise<ActivityLogEntry[]>`            | All activities for one record, newest first (ordered by `createdAt DESC`).                                                     |
| `findOpenForOwner`      | `ownerId: number`                                   | `Promise<ActivityLogEntry[]>`            | All open (`completed_at IS NULL`) activities owned by `ownerId`, ordered by `dueAt` ASC then `id` ASC.                         |
| `findOverdueForOwner`   | `ownerId: number, now?: Date`                       | `Promise<ActivityLogEntry[]>`            | Subset of open activities where `due_at <= now`. `now` defaults to `new Date()`.                                               |
| `findById`              | `id: number`                                        | `Promise<ActivityLogEntry \| undefined>` | Lookup by primary key.                                                                                                         |
| `create`                | `input: CreateActivityLogEntryDto, ownerId: number` | `Promise<ActivityLogEntry>`              | Inserts. Throws `BadRequestException` if `relatedType` or `type` are outside the configured allowed-types lists.               |
| `update`                | `id: number, input: UpdateActivityLogEntryDto`      | `Promise<ActivityLogEntry>`              | Patches `subject`, `description`, `dueAt`. `description: null` clears the field; `description: undefined` leaves it untouched. |
| `complete`              | `id: number, input?: CompleteActivityLogEntryDto`   | `Promise<ActivityLogEntry>`              | Sets `completed_at = now`. If `outcomeNotes` is provided, appends it to the existing `description` separated by a blank line.  |
| `delete`                | `id: number`                                        | `Promise<void>`                          | Hard-delete. Throws `NotFoundException` if missing.                                                                            |

---

## REST Endpoints

All endpoints require authentication and an RBAC permission on the `activities` resource.

| Method   | Path                       | Permission          | Description                                                                                                                                                                       |
| -------- | -------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`    | `/activities`              | `activities:read`   | List. With `relatedType` + `relatedId` query params: activities for that record. Without: open activities for the authenticated user (or `scope=overdue` for the overdue subset). |
| `GET`    | `/activities/:id`          | `activities:read`   | Get one.                                                                                                                                                                          |
| `POST`   | `/activities`              | `activities:create` | Create. Owner = authenticated user.                                                                                                                                               |
| `PATCH`  | `/activities/:id`          | `activities:update` | Patch.                                                                                                                                                                            |
| `POST`   | `/activities/:id/complete` | `activities:update` | Mark complete. Body: `{ outcomeNotes?: string }`.                                                                                                                                 |
| `DELETE` | `/activities/:id`          | `activities:delete` | Delete. Returns `204 No Content`.                                                                                                                                                 |

---

## Usage Example

```typescript
import { Injectable } from '@nestjs/common';
import { ActivityLogService } from '@open-kingdom/shared-backend-data-access-activity-log';

@Injectable()
export class OpportunityFollowupService {
  constructor(private readonly activities: ActivityLogService) {}

  async logFollowupCall(opportunityId: number, ownerId: number, dueIn: number) {
    return this.activities.create(
      {
        relatedType: 'opportunity',
        relatedId: opportunityId,
        type: 'call',
        subject: 'Follow-up call',
        description: 'Confirm pricing and align on next steps.',
        dueAt: new Date(Date.now() + dueIn),
      },
      ownerId
    );
  }
}
```

---

## Testing

```bash
nx test data-access-activity-log
```
