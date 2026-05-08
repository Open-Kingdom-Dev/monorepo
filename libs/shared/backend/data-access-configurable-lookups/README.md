# `@open-kingdom/shared-backend-data-access-configurable-lookups`

A NestJS module providing a generic, admin-editable reference-data table — every dropdown / picklist option in the application stored as `(list_key, value, label, sort_order, is_active, is_system)` rows. Domain code reads `findByListKey('opportunity_stage')` to render a dropdown; admins POST new entries through the REST API. Rows seeded by code can be marked `is_system = 1` to lock their `list_key`/`value` against renaming or deactivation.

This library is **domain-agnostic**: it doesn't know about CRM, billing, or any other vertical. Any feature that needs configurable enums uses it.

---

## Exports

| Export                                                                                | Kind                     | Description                                                                                                 |
| ------------------------------------------------------------------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `DataAccessConfigurableLookupsModule`                                                 | `class`                  | Standard NestJS module. Registers `ConfigurableLookupsController` and exports `ConfigurableLookupsService`. |
| `ConfigurableLookupsService`                                                          | `class`                  | Injectable service with read, write, and seed methods.                                                      |
| `ConfigurableLookupsController`                                                       | `class`                  | REST controller mounted at `/configurable-lookups`.                                                         |
| `configurableLookups`                                                                 | `BetterSQLite3Table`     | Drizzle table.                                                                                              |
| `ConfigurableLookupsTableName`                                                        | `'configurable_lookups'` | String constant.                                                                                            |
| `ConfigurableLookup` / `NewConfigurableLookup`                                        | `type`                   | Inferred select/insert types.                                                                               |
| `ConfigurableLookupDto`, `CreateConfigurableLookupDto`, `UpdateConfigurableLookupDto` | `class`                  | Swagger DTOs.                                                                                               |

---

## Drizzle Schema

### `configurable_lookups` Table

| Column       | Type                | Constraints                 | Description                                                                                                                                                      |
| ------------ | ------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`         | `integer`           | Primary key, auto-increment |                                                                                                                                                                  |
| `list_key`   | `text`              | Not null                    | Snake-case identifier for the list (e.g. `'opportunity_stage'`). Conventionally a member of `LOOKUP_LIST_KEYS` from `crm-poly-util-domain` when used by the CRM. |
| `value`      | `text`              | Not null                    | The canonical machine value stored in domain rows (e.g. `'discovery'`).                                                                                          |
| `label`      | `text`              | Not null                    | The human-readable label rendered in dropdowns (e.g. `'Discovery'`).                                                                                             |
| `sort_order` | `integer`           | Not null, default `0`       | Display order within a list. Lower numbers come first.                                                                                                           |
| `is_system`  | `integer`           | Not null, default `0`       | When `1`, the row was inserted by code (e.g. via `seedDefaults`). System rows cannot be renamed, deleted, or deactivated.                                        |
| `is_active`  | `integer`           | Not null, default `1`       | Soft-toggle. Inactive rows are excluded from `findByListKey()` unless `includeInactive` is set.                                                                  |
| `created_at` | `integer` timestamp | Not null, default now       |                                                                                                                                                                  |
| `updated_at` | `integer` timestamp | Not null, default now       | Bumped on update.                                                                                                                                                |

Unique index: `configurable_lookups_list_value_uq` on (`list_key`, `value`) — no two rows in the same list can share a value.

---

## Module Registration

`DataAccessConfigurableLookupsModule` is a standard module. Import it where you want the service available, and add the table to the root schema composition.

```typescript
import { DataAccessConfigurableLookupsModule } from '@open-kingdom/shared-backend-data-access-configurable-lookups';

@Module({
  imports: [DataAccessConfigurableLookupsModule],
})
export class SomeFeatureModule {}
```

```typescript
import { configurableLookups } from '@open-kingdom/shared-backend-data-access-configurable-lookups';

const schema = {
  // …
  configurableLookups,
};

DatabaseSetupModule.register({ schema, filename: 'app.db' });
```

---

## Configuration

No module-level configuration. Resolves its database via `DB_TAG`.

---

## ConfigurableLookupsService API

```typescript
constructor(private lookups: ConfigurableLookupsService) {}
```

| Method               | Parameters                                              | Returns                                    | Description                                                                                                                                                                                                                                                      |
| -------------------- | ------------------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `findByListKey`      | `listKey: string, opts?: { includeInactive?: boolean }` | `Promise<ConfigurableLookup[]>`            | Lists entries for one list, ordered by `sortOrder` then `id`. Filters out `isActive === 0` rows unless `includeInactive` is set.                                                                                                                                 |
| `findAll`            | —                                                       | `Promise<ConfigurableLookup[]>`            | Lists all entries, ordered by `listKey`, `sortOrder`, `id`.                                                                                                                                                                                                      |
| `findById`           | `id: number`                                            | `Promise<ConfigurableLookup \| undefined>` | Lookup by primary key.                                                                                                                                                                                                                                           |
| `findByListAndValue` | `listKey: string, value: string`                        | `Promise<ConfigurableLookup \| undefined>` | Resolve a `(list_key, value)` pair to a row.                                                                                                                                                                                                                     |
| `create`             | `input: CreateConfigurableLookupDto`                    | `Promise<ConfigurableLookup>`              | Inserts as `is_system = 0`. Throws `ConflictException` if `(listKey, value)` already exists.                                                                                                                                                                     |
| `update`             | `id: number, input: UpdateConfigurableLookupDto`        | `Promise<ConfigurableLookup>`              | Patches the row. **System-row rules:** changing `listKey` or `value` is forbidden, and `isActive: false` is forbidden — only `label` and `sortOrder` are editable. Throws `ConflictException` if the resulting `(listKey, value)` pair clashes with another row. |
| `delete`             | `id: number`                                            | `Promise<void>`                            | Hard-deletes a non-system row. Throws `ForbiddenException` if `is_system = 1` (deactivate non-system rows instead).                                                                                                                                              |
| `seedDefaults`       | `defaults: { listKey, value, label, sortOrder? }[]`     | `Promise<void>`                            | Idempotent insert-if-missing. Inserted rows are tagged `is_system = 1`. Used during application bootstrap to populate canonical defaults.                                                                                                                        |

---

## REST Endpoints

All endpoints require authentication and an RBAC permission on the `lookups` resource.

| Method   | Path                        | Permission       | Description                                                                                         |
| -------- | --------------------------- | ---------------- | --------------------------------------------------------------------------------------------------- |
| `GET`    | `/configurable-lookups`     | `lookups:read`   | List entries. Optional query: `listKey` (filter to one list), `includeInactive` (`'true'` / `'1'`). |
| `GET`    | `/configurable-lookups/:id` | `lookups:read`   | Get one.                                                                                            |
| `POST`   | `/configurable-lookups`     | `lookups:create` | Create. Inserted as a non-system row.                                                               |
| `PATCH`  | `/configurable-lookups/:id` | `lookups:update` | Patch. System-row restrictions apply.                                                               |
| `DELETE` | `/configurable-lookups/:id` | `lookups:delete` | Delete (non-system rows only). Returns `204 No Content`.                                            |

---

## Seeding Defaults from a Feature Module

The recommended pattern is for each feature module to declare its own default lookup entries and seed them on startup:

```typescript
import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigurableLookupsService } from '@open-kingdom/shared-backend-data-access-configurable-lookups';

const DEFAULTS = [
  { listKey: 'opportunity_stage', value: 'new', label: 'New', sortOrder: 10 },
  { listKey: 'opportunity_stage', value: 'discovery', label: 'Discovery', sortOrder: 20 },
  { listKey: 'opportunity_stage', value: 'proposal', label: 'Proposal', sortOrder: 30 },
  { listKey: 'opportunity_stage', value: 'negotiation', label: 'Negotiation', sortOrder: 40 },
  { listKey: 'opportunity_stage', value: 'won', label: 'Won', sortOrder: 50 },
  { listKey: 'opportunity_stage', value: 'lost', label: 'Lost', sortOrder: 60 },
];

@Injectable()
export class CrmSeedService implements OnApplicationBootstrap {
  constructor(private readonly lookups: ConfigurableLookupsService) {}

  async onApplicationBootstrap() {
    await this.lookups.seedDefaults(DEFAULTS);
  }
}
```

The CRM ships its own default seed in `@open-kingdom/crm-backend-feature-crm` (`CrmSeedService`).

---

## Testing

```bash
nx test data-access-configurable-lookups
```
