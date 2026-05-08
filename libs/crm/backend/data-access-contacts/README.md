# `@open-kingdom/crm-backend-data-access-contacts`

A NestJS module providing persistence and REST endpoints for the two foundational CRM entities — **companies** and **contacts**. Both entities are owner-scoped (each row carries an `ownerId` foreign key into `users`), support soft-deletion via `isArchived`, and are guarded by RBAC permissions on the `companies` and `contacts` resources.

This is a `data-access` library: it owns the Drizzle table definitions, the services, and the REST controllers, but performs no cross-entity orchestration. Higher-level workflows (lead conversion, opportunity pipeline) live in `@open-kingdom/crm-backend-feature-crm`.

---

## Exports

| Export                                  | Kind                 | Description                                                                                                                          |
| --------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `DataAccessContactsModule`              | `class`              | Standard NestJS module. Registers `CompaniesController` and `ContactsController` and exports `CompaniesService` + `ContactsService`. |
| `CompaniesService`                      | `class`              | Injectable service for company CRUD, search, archive/restore, and ownership checks.                                                  |
| `ContactsService`                       | `class`              | Injectable service for contact CRUD and search.                                                                                      |
| `CompaniesController`                   | `class`              | REST controller mounted at `/companies`.                                                                                             |
| `ContactsController`                    | `class`              | REST controller mounted at `/contacts`.                                                                                              |
| `companies`                             | `BetterSQLite3Table` | Drizzle table definition for the `companies` table.                                                                                  |
| `contacts`                              | `BetterSQLite3Table` | Drizzle table definition for the `contacts` table.                                                                                   |
| `CompaniesTableName`                    | `'companies'`        | String constant for use in typed schema composition.                                                                                 |
| `ContactsTableName`                     | `'contacts'`         | String constant for use in typed schema composition.                                                                                 |
| `Company` / `NewCompany`                | `type`               | Inferred `$inferSelect` / `$inferInsert` types.                                                                                      |
| `Contact` / `NewContact`                | `type`               | Inferred `$inferSelect` / `$inferInsert` types.                                                                                      |
| `CompanyFilter`                         | `interface`          | Filter object accepted by `CompaniesService.findAll()`.                                                                              |
| `ContactFilter`                         | `interface`          | Filter object accepted by `ContactsService.findAll()`.                                                                               |
| `CompanyDto` / `ContactDto`             | `class`              | Swagger response DTOs.                                                                                                               |
| `CreateCompanyDto` / `UpdateCompanyDto` | `class`              | Swagger request DTOs for companies.                                                                                                  |
| `CreateContactDto` / `UpdateContactDto` | `class`              | Swagger request DTOs for contacts.                                                                                                   |

---

## Drizzle Schemas

### `companies` Table

| Column          | Type                | Constraints                  | Description                                                       |
| --------------- | ------------------- | ---------------------------- | ----------------------------------------------------------------- |
| `id`            | `integer`           | Primary key, auto-increment  |                                                                   |
| `name`          | `text`              | Not null                     | Company name.                                                     |
| `website`       | `text`              | Nullable                     |                                                                   |
| `primary_phone` | `text`              | Nullable                     |                                                                   |
| `industry`      | `text`              | Nullable                     | Free-form; suggested values come from the `industry` lookup list. |
| `status`        | `text`              | Not null, default `'active'` | Suggested values come from the `company_status` lookup list.      |
| `location`      | `text`              | Nullable                     |                                                                   |
| `company_size`  | `text`              | Nullable                     |                                                                   |
| `revenue_range` | `text`              | Nullable                     |                                                                   |
| `notes_summary` | `text`              | Nullable                     | Short summary surfaced in list views.                             |
| `owner_id`      | `integer`           | Not null, FK → `users.id`    | Owner user.                                                       |
| `is_archived`   | `integer`           | Not null, default `0`        | Soft-delete flag (0/1).                                           |
| `created_at`    | `integer` timestamp | Not null, default now        |                                                                   |
| `updated_at`    | `integer` timestamp | Not null, default now        | Bumped on every update.                                           |

Indexes: `companies_owner_idx` (`owner_id`), `companies_name_idx` (`name`), `companies_status_idx` (`status`).

### `contacts` Table

| Column            | Type                | Constraints                   | Description                         |
| ----------------- | ------------------- | ----------------------------- | ----------------------------------- |
| `id`              | `integer`           | Primary key, auto-increment   |                                     |
| `first_name`      | `text`              | Not null                      |                                     |
| `last_name`       | `text`              | Not null                      |                                     |
| `email`           | `text`              | Nullable                      | Primary email (not unique).         |
| `phone`           | `text`              | Nullable                      |                                     |
| `secondary_phone` | `text`              | Nullable                      |                                     |
| `secondary_email` | `text`              | Nullable                      |                                     |
| `job_title`       | `text`              | Nullable                      |                                     |
| `company_id`      | `integer`           | Nullable, FK → `companies.id` | Optional employing company.         |
| `lead_source`     | `text`              | Nullable                      | From the `lead_source` lookup list. |
| `tags`            | `text`              | Nullable                      | Free-form, comma-separated.         |
| `mailing_address` | `text`              | Nullable                      |                                     |
| `notes_summary`   | `text`              | Nullable                      |                                     |
| `status`          | `text`              | Not null, default `'active'`  |                                     |
| `owner_id`        | `integer`           | Not null, FK → `users.id`     | Owner user.                         |
| `is_archived`     | `integer`           | Not null, default `0`         | Soft-delete flag.                   |
| `created_at`      | `integer` timestamp | Not null, default now         |                                     |
| `updated_at`      | `integer` timestamp | Not null, default now         |                                     |

Indexes: `contacts_owner_idx` (`owner_id`), `contacts_company_idx` (`company_id`), `contacts_email_idx` (`email`), `contacts_last_first_idx` (`last_name`, `first_name`).

---

## Module Registration

`DataAccessContactsModule` is a standard module — no `forRoot()`. It assumes the database is already wired via `DatabaseSetupModule.register()` in the root composition module, and that the `companies` and `contacts` tables are present in the registered schema object. App-level wiring is expected to live in `demo-scaffold-backend-feature-root-schema` (or its equivalent).

```typescript
import { DataAccessContactsModule } from '@open-kingdom/crm-backend-data-access-contacts';

@Module({
  imports: [DataAccessContactsModule],
})
export class SomeFeatureModule {}
```

`CompaniesService` and `ContactsService` are exported and can be injected by any module that imports `DataAccessContactsModule`.

### Schema composition

Add the tables to the root schema module:

```typescript
import { companies, contacts, CompaniesTableName, ContactsTableName } from '@open-kingdom/crm-backend-data-access-contacts';

const schema = {
  // …
  [CompaniesTableName]: companies,
  [ContactsTableName]: contacts,
};

DatabaseSetupModule.register({ schema, filename: 'app.db' });
```

---

## Configuration

No module-level configuration. The services resolve their database via the global `DB_TAG` token.

---

## CompaniesService API

```typescript
constructor(private companies: CompaniesService) {}
```

| Method               | Parameters                                        | Returns                         | Description                                                                                                                         |
| -------------------- | ------------------------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `findAll`            | `filter?: CompanyFilter`                          | `Promise<Company[]>`            | Lists companies, ordered by `name`. Excludes archived rows unless `filter.includeArchived` is `true`.                               |
| `findById`           | `id: number`                                      | `Promise<Company \| undefined>` | Lookup by primary key.                                                                                                              |
| `create`             | `input: CreateCompanyDto, defaultOwnerId: number` | `Promise<Company>`              | Inserts. `ownerId` defaults to `defaultOwnerId` (typically the authenticated user); `status` defaults to `'active'`.                |
| `update`             | `id: number, input: UpdateCompanyDto`             | `Promise<Company>`              | Patches the row, ignoring `undefined` fields. Bumps `updatedAt`. Throws `NotFoundException` if missing.                             |
| `archive`            | `id: number`                                      | `Promise<Company>`              | Sets `isArchived = 1`.                                                                                                              |
| `restore`            | `id: number`                                      | `Promise<Company>`              | Sets `isArchived = 0`.                                                                                                              |
| `assertOwnerOrAdmin` | `id: number, userId: number, isAdmin: boolean`    | `Promise<Company>`              | Throws `NotFoundException` if the company doesn't exist, `ForbiddenException` if `userId` isn't the owner and `isAdmin` is `false`. |

`CompanyFilter` shape: `{ ownerId?, status?, search?, includeArchived? }`. `search` runs a `LIKE %search%` across `name`, `website`, and `industry`.

---

## ContactsService API

```typescript
constructor(private contacts: ContactsService) {}
```

| Method     | Parameters                                        | Returns                         | Description                                                                                                 |
| ---------- | ------------------------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `findAll`  | `filter?: ContactFilter`                          | `Promise<Contact[]>`            | Lists contacts, ordered by `lastName`, `firstName`. Excludes archived rows unless `filter.includeArchived`. |
| `findById` | `id: number`                                      | `Promise<Contact \| undefined>` | Lookup by primary key.                                                                                      |
| `create`   | `input: CreateContactDto, defaultOwnerId: number` | `Promise<Contact>`              | Inserts. `ownerId` defaults to `defaultOwnerId`; `status` defaults to `'active'`.                           |
| `update`   | `id: number, input: UpdateContactDto`             | `Promise<Contact>`              | Patches, ignoring `undefined` fields. Bumps `updatedAt`.                                                    |
| `archive`  | `id: number`                                      | `Promise<Contact>`              | Soft-delete.                                                                                                |
| `restore`  | `id: number`                                      | `Promise<Contact>`              | Un-archive.                                                                                                 |

`ContactFilter` shape: `{ ownerId?, companyId?, status?, search?, includeArchived? }`. `search` runs a `LIKE %search%` across `firstName`, `lastName`, `email`, and `phone`.

---

## REST Endpoints

All endpoints require authentication (`@ApiBearerAuth('JWT-auth')`) and an RBAC permission via `@RequirePermission` (`@open-kingdom/shared-backend-util-rbac`).

### Companies — `/companies`

| Method  | Path                     | Permission         | Description                                                               |
| ------- | ------------------------ | ------------------ | ------------------------------------------------------------------------- |
| `GET`   | `/companies`             | `companies:read`   | List, with `ownerId`, `status`, `search`, `includeArchived` query params. |
| `GET`   | `/companies/:id`         | `companies:read`   | Get one.                                                                  |
| `POST`  | `/companies`             | `companies:create` | Create. Owner defaults to authenticated user.                             |
| `PATCH` | `/companies/:id`         | `companies:update` | Patch.                                                                    |
| `POST`  | `/companies/:id/archive` | `companies:update` | Soft-delete.                                                              |
| `POST`  | `/companies/:id/restore` | `companies:update` | Un-archive.                                                               |

### Contacts — `/contacts`

| Method  | Path                    | Permission        | Description                                                                            |
| ------- | ----------------------- | ----------------- | -------------------------------------------------------------------------------------- |
| `GET`   | `/contacts`             | `contacts:read`   | List, with `ownerId`, `companyId`, `status`, `search`, `includeArchived` query params. |
| `GET`   | `/contacts/:id`         | `contacts:read`   | Get one.                                                                               |
| `POST`  | `/contacts`             | `contacts:create` | Create. Owner defaults to authenticated user.                                          |
| `PATCH` | `/contacts/:id`         | `contacts:update` | Patch.                                                                                 |
| `POST`  | `/contacts/:id/archive` | `contacts:update` | Soft-delete.                                                                           |
| `POST`  | `/contacts/:id/restore` | `contacts:update` | Un-archive.                                                                            |

---

## Usage Example

```typescript
import { Injectable } from '@nestjs/common';
import { CompaniesService, ContactsService } from '@open-kingdom/crm-backend-data-access-contacts';

@Injectable()
export class AccountSummaryService {
  constructor(private readonly companies: CompaniesService, private readonly contacts: ContactsService) {}

  async summarize(companyId: number) {
    const company = await this.companies.findById(companyId);
    if (!company) return null;
    const employees = await this.contacts.findAll({ companyId });
    return { company, contactCount: employees.length };
  }
}
```

---

## Testing

```bash
nx test crm-backend-data-access-contacts
```
