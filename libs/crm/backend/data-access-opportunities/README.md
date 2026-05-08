# `@open-kingdom/crm-backend-data-access-opportunities`

A NestJS module providing persistence and REST endpoints for the two CRM pipeline entities — **leads** (top-of-funnel inquiries) and **opportunities** (qualified deals in motion). Leads are intentionally lightweight and exist only until they are converted into a contact + company; opportunities are the long-lived records that move through pipeline stages and ultimately close as `won` or `lost`.

This library depends on `crm-backend-data-access-contacts` (its tables reference `companies.id` and `contacts.id`) and on `crm-poly-util-domain` for the `OpportunityStage` vocabulary.

---

## Exports

| Export                           | Kind                 | Description                                                                                                                           |
| -------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `DataAccessOpportunitiesModule`  | `class`              | Standard NestJS module. Registers `LeadsController` + `OpportunitiesController` and exports `LeadsService` + `OpportunitiesService`.  |
| `LeadsService`                   | `class`              | Injectable service for lead CRUD + conversion bookkeeping.                                                                            |
| `OpportunitiesService`           | `class`              | Injectable service for opportunity CRUD, closing, and pipeline aggregation.                                                           |
| `LeadsController`                | `class`              | REST controller mounted at `/leads`.                                                                                                  |
| `OpportunitiesController`        | `class`              | REST controller mounted at `/opportunities`.                                                                                          |
| `leads`                          | `BetterSQLite3Table` | Drizzle table for `leads`.                                                                                                            |
| `opportunities`                  | `BetterSQLite3Table` | Drizzle table for `opportunities`.                                                                                                    |
| `LeadsTableName`                 | `'leads'`            | String constant.                                                                                                                      |
| `OpportunitiesTableName`         | `'opportunities'`    | String constant.                                                                                                                      |
| `Lead` / `NewLead`               | `type`               | Inferred select/insert types.                                                                                                         |
| `Opportunity` / `NewOpportunity` | `type`               | Inferred select/insert types.                                                                                                         |
| `LeadFilter`                     | `interface`          | Filter object for `LeadsService.findAll()`.                                                                                           |
| `OpportunityFilter`              | `interface`          | Filter object for `OpportunitiesService.findAll()`.                                                                                   |
| `StageSummary`                   | `interface`          | One row of `OpportunitiesService.pipelineSummary()` output.                                                                           |
| DTOs                             | `class`              | `LeadDto`, `CreateLeadDto`, `UpdateLeadDto`, `OpportunityDto`, `CreateOpportunityDto`, `UpdateOpportunityDto`, `CloseOpportunityDto`. |

---

## Drizzle Schemas

### `leads` Table

| Column                    | Type                | Constraints                   | Description                                                                 |
| ------------------------- | ------------------- | ----------------------------- | --------------------------------------------------------------------------- |
| `id`                      | `integer`           | Primary key, auto-increment   |                                                                             |
| `name`                    | `text`              | Not null                      | Lead's full name.                                                           |
| `company_name`            | `text`              | Nullable                      | Free-form company name (pre-conversion).                                    |
| `email`                   | `text`              | Nullable                      | At least one of `email` or `phone` is required.                             |
| `phone`                   | `text`              | Nullable                      |                                                                             |
| `source`                  | `text`              | Nullable                      | Suggested values come from the `lead_source` lookup list.                   |
| `status`                  | `text`              | Not null, default `'new'`     | Suggested values from the `lead_status` lookup list and `LeadStatus` union. |
| `notes`                   | `text`              | Nullable                      |                                                                             |
| `contact_id`              | `integer`           | Nullable, FK → `contacts.id`  | Existing contact (rare; usually unset).                                     |
| `company_id`              | `integer`           | Nullable, FK → `companies.id` | Existing company (rare).                                                    |
| `converted_at`            | `integer` timestamp | Nullable                      | Set by `markConverted()`.                                                   |
| `converted_to_contact_id` | `integer`           | Nullable, FK → `contacts.id`  | Set by `markConverted()`.                                                   |
| `converted_to_company_id` | `integer`           | Nullable, FK → `companies.id` | Set by `markConverted()`.                                                   |
| `owner_id`                | `integer`           | Not null, FK → `users.id`     |                                                                             |
| `created_at`              | `integer` timestamp | Not null, default now         |                                                                             |
| `updated_at`              | `integer` timestamp | Not null, default now         |                                                                             |

Indexes: `leads_owner_idx` (`owner_id`), `leads_status_idx` (`status`).

### `opportunities` Table

| Column                | Type                | Constraints                   | Description                                                                                  |
| --------------------- | ------------------- | ----------------------------- | -------------------------------------------------------------------------------------------- |
| `id`                  | `integer`           | Primary key, auto-increment   |                                                                                              |
| `title`               | `text`              | Not null                      |                                                                                              |
| `company_id`          | `integer`           | Not null, FK → `companies.id` | Required — every opportunity belongs to a company.                                           |
| `primary_contact_id`  | `integer`           | Nullable, FK → `contacts.id`  |                                                                                              |
| `stage`               | `text`              | Not null, default `'new'`     | Member of `OpportunityStage` (`new`, `discovery`, `proposal`, `negotiation`, `won`, `lost`). |
| `estimated_value`     | `real`              | Nullable                      |                                                                                              |
| `probability`         | `real`              | Nullable                      | Percent (0–100). Used to compute weighted pipeline value.                                    |
| `expected_close_date` | `integer` timestamp | Nullable                      |                                                                                              |
| `closed_at`           | `integer` timestamp | Nullable                      | Set by `close()` when stage moves to `won`/`lost`.                                           |
| `loss_reason`         | `text`              | Nullable                      | Set by `close()` only when outcome is `lost`.                                                |
| `notes`               | `text`              | Nullable                      |                                                                                              |
| `owner_id`            | `integer`           | Not null, FK → `users.id`     |                                                                                              |
| `created_at`          | `integer` timestamp | Not null, default now         |                                                                                              |
| `updated_at`          | `integer` timestamp | Not null, default now         |                                                                                              |

Indexes: `opportunities_owner_idx`, `opportunities_stage_idx`, `opportunities_company_idx`, `opportunities_close_date_idx`.

---

## Module Registration

`DataAccessOpportunitiesModule` is a standard module — no `forRoot()`. It assumes the database is already wired and that `leads` and `opportunities` (and their referenced `users`, `companies`, `contacts` tables) are present in the registered schema.

```typescript
import { DataAccessOpportunitiesModule } from '@open-kingdom/crm-backend-data-access-opportunities';

@Module({
  imports: [DataAccessOpportunitiesModule],
})
export class SomeFeatureModule {}
```

### Schema composition

```typescript
import { leads, opportunities, LeadsTableName, OpportunitiesTableName } from '@open-kingdom/crm-backend-data-access-opportunities';

const schema = {
  // …
  [LeadsTableName]: leads,
  [OpportunitiesTableName]: opportunities,
};
```

---

## Configuration

No module-level configuration. Services resolve their database via the global `DB_TAG` token.

---

## LeadsService API

| Method          | Parameters                                                     | Returns                      | Description                                                                                                                                                      |
| --------------- | -------------------------------------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `findAll`       | `filter?: LeadFilter`                                          | `Promise<Lead[]>`            | Lists leads ordered by `createdAt`. `LeadFilter`: `{ ownerId?, status?, search?, includeConverted? }`. `search` matches `name`, `companyName`, `email`, `phone`. |
| `findById`      | `id: number`                                                   | `Promise<Lead \| undefined>` | Lookup by primary key.                                                                                                                                           |
| `create`        | `input: CreateLeadDto, defaultOwnerId: number`                 | `Promise<Lead>`              | Inserts. Throws `BadRequestException` unless at least one of `email` / `phone` is provided. `status` defaults to `'new'`.                                        |
| `update`        | `id: number, input: UpdateLeadDto`                             | `Promise<Lead>`              | Patches the row, ignoring `undefined` fields.                                                                                                                    |
| `markConverted` | `id: number, contactId: number\|null, companyId: number\|null` | `Promise<Lead>`              | Sets `status = 'qualified'`, `convertedAt = now`, `convertedToContactId`, `convertedToCompanyId`. Called by the lead conversion workflow in `feature-crm`.       |
| `delete`        | `id: number`                                                   | `Promise<void>`              | Hard-delete. (Leads have no `is_archived` flag.)                                                                                                                 |

---

## OpportunitiesService API

| Method            | Parameters                                            | Returns                             | Description                                                                                                                                                                                                                                |
| ----------------- | ----------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `findAll`         | `filter?: OpportunityFilter`                          | `Promise<Opportunity[]>`            | Lists ordered by `expectedCloseDate`, then `id`. `OpportunityFilter`: `{ ownerId?, companyId?, stage?, search?, openOnly? }`. `openOnly` excludes `won`/`lost` (terminal stages, in JS for portability). `search` matches `title`/`notes`. |
| `findById`        | `id: number`                                          | `Promise<Opportunity \| undefined>` | Lookup by primary key.                                                                                                                                                                                                                     |
| `create`          | `input: CreateOpportunityDto, defaultOwnerId: number` | `Promise<Opportunity>`              | Inserts. `stage` defaults to `'new'`.                                                                                                                                                                                                      |
| `update`          | `id: number, input: UpdateOpportunityDto`             | `Promise<Opportunity>`              | Patches the row, ignoring `undefined` fields.                                                                                                                                                                                              |
| `close`           | `id: number, input: CloseOpportunityDto`              | `Promise<Opportunity>`              | Sets `stage` to `won` or `lost` (per `input.outcome`), `closedAt = now`, and (only when `lost`) records `lossReason`.                                                                                                                      |
| `pipelineSummary` | `ownerId?: number`                                    | `Promise<StageSummary[]>`           | Group-by-`stage` aggregate: `{ stage, count, totalValue, weightedValue }`. `weightedValue = sum(estimated_value * probability / 100)`. Filter optionally to one owner.                                                                     |

---

## REST Endpoints

All endpoints require authentication and an RBAC permission via `@RequirePermission`.

### Leads — `/leads`

| Method   | Path         | Permission     | Description                                                                |
| -------- | ------------ | -------------- | -------------------------------------------------------------------------- |
| `GET`    | `/leads`     | `leads:read`   | List, with `ownerId`, `status`, `search`, `includeConverted` query params. |
| `GET`    | `/leads/:id` | `leads:read`   | Get one.                                                                   |
| `POST`   | `/leads`     | `leads:create` | Create.                                                                    |
| `PATCH`  | `/leads/:id` | `leads:update` | Patch.                                                                     |
| `DELETE` | `/leads/:id` | `leads:delete` | Hard-delete.                                                               |

Conversion (`POST /crm/leads/:id/convert`) lives in `crm-backend-feature-crm` because it spans contacts, companies, and leads.

### Opportunities — `/opportunities`

| Method  | Path                              | Permission             | Description                                                                          |
| ------- | --------------------------------- | ---------------------- | ------------------------------------------------------------------------------------ |
| `GET`   | `/opportunities`                  | `opportunities:read`   | List, with `ownerId`, `companyId`, `stage`, `search`, `openOnly` query params.       |
| `GET`   | `/opportunities/pipeline-summary` | `opportunities:read`   | Stage-by-stage aggregate (`StageSummary[]`).                                         |
| `GET`   | `/opportunities/:id`              | `opportunities:read`   | Get one.                                                                             |
| `POST`  | `/opportunities`                  | `opportunities:create` | Create.                                                                              |
| `PATCH` | `/opportunities/:id`              | `opportunities:update` | Patch.                                                                               |
| `POST`  | `/opportunities/:id/close`        | `opportunities:update` | Close as `won` or `lost`. Body: `{ outcome: 'won' \| 'lost', lossReason?: string }`. |

---

## Usage Example

```typescript
import { Injectable } from '@nestjs/common';
import { OpportunitiesService } from '@open-kingdom/crm-backend-data-access-opportunities';

@Injectable()
export class ForecastService {
  constructor(private readonly opportunities: OpportunitiesService) {}

  async weightedForecastForOwner(ownerId: number) {
    const summary = await this.opportunities.pipelineSummary(ownerId);
    return summary.filter((s) => s.stage !== 'won' && s.stage !== 'lost').reduce((acc, s) => acc + s.weightedValue, 0);
  }
}
```

---

## Testing

```bash
nx test crm-backend-data-access-opportunities
```
