# `@open-kingdom/crm-backend-feature-crm`

The orchestration layer of the CRM. Composes the four CRM data-access modules (`contacts`, `opportunities`, plus the shared `activity-log` and `configurable-lookups`) and adds three things they cannot do individually:

1. **Lead conversion** — turns a qualified lead into a contact (+ optionally a new company and a new opportunity), all atomically and with the lead's `convertedAt` / `convertedTo*` fields populated.
2. **Dashboard snapshot** — pipeline stage summary plus open and overdue task counts for one user.
3. **Bootstrap seeding** — populates the `configurable_lookups` table with the canonical CRM lookup entries (lead status, opportunity stage, activity type, etc.) and maps a baseline RBAC permission set onto the `admin`, `user`, and `manager` roles, so a fresh database has working dropdowns and access controls without manual setup.

This is the only library a host app needs to import to "turn the CRM on" — its `forRoot()` brings in the four data-access modules transitively.

---

## Exports

| Export                                                             | Kind                            | Description                                                                                                 |
| ------------------------------------------------------------------ | ------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `FeatureCrmModule`                                                 | `class`                         | Dynamic NestJS module. Use `forRoot()` to enable bootstrap seeding; the bare module skips the seed service. |
| `CrmFeatureOptions`                                                | `interface`                     | `{ seedDefaults?: boolean }`. Defaults to `true`. Pass `false` to suppress lookup + RBAC seeding on init.   |
| `CRM_FEATURE_OPTIONS`                                              | `'CRM_FEATURE_OPTIONS'`         | DI token for the options object — exported for advanced consumers.                                          |
| `LeadConversionService`                                            | `class`                         | Implements the lead → contact / company / opportunity conversion workflow.                                  |
| `LeadConversionController`                                         | `class`                         | REST controller mounted at `/leads/:id/convert`.                                                            |
| `DashboardService`                                                 | `class`                         | Composes `OpportunitiesService.pipelineSummary` + `ActivityLogService.findOpen/Overdue` for one user.       |
| `DashboardController`                                              | `class`                         | REST controller mounted at `/crm/dashboard`.                                                                |
| `CrmSeedService`                                                   | `class`                         | `OnModuleInit`. Runs `seedLookups` and `mapRolePermissions` on bootstrap. Only registered by `forRoot()`.   |
| `ConvertLeadInput` / `ConvertLeadResult`                           | `interface`                     | Input / output types for `LeadConversionService.convert()`.                                                 |
| `DashboardSnapshot`                                                | `interface`                     | Return type of `DashboardService.snapshotForUser()`.                                                        |
| `ConvertLeadRequestDto`, `DashboardSnapshotDto`, `StageSummaryDto` | `class`                         | Swagger DTOs.                                                                                               |
| `DEFAULT_CRM_LOOKUPS`                                              | `readonly DefaultLookupEntry[]` | The canonical seed payload — 30 entries across 7 lookup lists.                                              |
| `CRM_RESOURCES`                                                    | `readonly CrmResource[]`        | `['contacts', 'companies', 'leads', 'opportunities', 'activities', 'lookups']`                              |
| `CRM_ACTIONS`                                                      | `readonly string[]`             | `['read', 'create', 'update', 'delete']`                                                                    |
| `CRM_ROLE_PERMISSIONS`                                             | `Record<string, …>`             | Permission grid mapped onto the `admin`, `user`, and `manager` roles by `CrmSeedService`.                   |
| `CrmResource`                                                      | `type`                          | Union of the six CRM resource strings.                                                                      |

---

## Module Registration

`FeatureCrmModule` is a dynamic module. The recommended form is `forRoot()`, which enables bootstrap seeding.

```typescript
import { FeatureCrmModule } from '@open-kingdom/crm-backend-feature-crm';

@Module({
  imports: [FeatureCrmModule.forRoot({ seedDefaults: true })],
})
export class AppModule {}
```

Importing `FeatureCrmModule` directly (without `forRoot()`) wires the same controllers and services, but skips `CrmSeedService` — useful in tests where you don't want the lookup table or role table to be touched on startup.

The module imports its four CRM data-access dependencies transitively, so you do **not** need to import `DataAccessContactsModule`, `DataAccessOpportunitiesModule`, `DataAccessActivityLogModule`, or `DataAccessConfigurableLookupsModule` separately when wiring an app.

`CrmSeedService` additionally requires `FeatureUserManagementModule.forRoot()` to be present in the app module — it uses `RolesService` and `PermissionsService` to map RBAC permissions onto roles. NestJS de-duplicates the module instance, so a single `FeatureUserManagementModule.forRoot()` registration in `AppModule` is sufficient.

### Schema composition

This module owns no tables of its own — schema composition for the CRM is done at the data-access layer. Make sure the root schema module includes:

```typescript
import { activityLog } from '@open-kingdom/shared-backend-data-access-activity-log';
import { configurableLookups } from '@open-kingdom/shared-backend-data-access-configurable-lookups';
import { companies, contacts } from '@open-kingdom/crm-backend-data-access-contacts';
import { leads, opportunities } from '@open-kingdom/crm-backend-data-access-opportunities';
```

---

## Configuration

| Option         | Type                             | Default  | Description                                                                                                                      |
| -------------- | -------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `seed`         | `'none' \| 'lookups' \| 'full'`  | `'full'` | What `CrmSeedService` seeds on init. `'lookups'` seeds dropdown data only and works WITHOUT `FeatureUserManagementModule` — for embedded hosts that bring their own identity/RBAC. `'full'` additionally maps the baseline CRM permissions onto the system roles. |
| `seedDefaults` | `boolean`                        | `true`   | **Deprecated** — use `seed`. `true` ≡ `'full'`, `false` ≡ `'none'`. Ignored when `seed` is set.                                    |

### Embedded hosts (no OpenKingdom auth stack)

The CRM boots without `FeatureUserManagementModule`, `OpenKingdomFeatureBackendAuthModule`, or
`EmailModule`: register `FeatureCrmModule.forRoot({ seed: 'lookups' })`, register no global
guards, and stamp `req.user = { id, email }` from your own middleware (see `AuthenticatedRequest`
in `@open-kingdom/shared-backend-util-rbac`). Controllers use `req.user.id` for record ownership;
the `@RequirePermission` decorators are inert metadata without `PermissionGuard`.
`src/lib/embedded-mode.integration.spec.ts` is a complete working example, including generating
the DDL with `drizzle-kit/api`.

---

## LeadConversionService API

```typescript
constructor(private readonly conversion: LeadConversionService) {}
```

| Method    | Parameters                | Returns                      | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --------- | ------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `convert` | `input: ConvertLeadInput` | `Promise<ConvertLeadResult>` | Resolves a company (existing via `companyId`, or newly created from `lead.companyName` with status `'prospect'`, or `null` if the lead has no company info). Resolves a contact (existing via `contactId`, possibly re-parented to the resolved company; or newly created from `lead.name`/`email`/`phone`/`source`). Optionally creates an opportunity tied to the company + contact (default behavior unless `createOpportunity: false` or no company resolved). Marks the lead converted and returns all four entities. Throws `NotFoundException` if the lead, supplied contact, or supplied company is missing. Throws `BadRequestException` if the lead has already been converted. |

### `ConvertLeadInput`

| Property                    | Type      | Description                                                                                                                             |
| --------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `leadId`                    | `number`  | Required.                                                                                                                               |
| `contactId`                 | `number`  | Optional — link to an existing contact instead of creating one. Will be re-parented to the resolved company if its `companyId` differs. |
| `companyId`                 | `number`  | Optional — link to an existing company instead of creating one from `lead.companyName`.                                                 |
| `createOpportunity`         | `boolean` | Defaults to `true`. Set `false` to skip opportunity creation.                                                                           |
| `opportunityTitle`          | `string`  | Defaults to `${company.name} — ${lead.name}`.                                                                                           |
| `opportunityEstimatedValue` | `number`  | Optional initial value.                                                                                                                 |

### `ConvertLeadResult`

`{ lead, contact, company, opportunity }` — `company` and `opportunity` may be `null`.

---

## DashboardService API

```typescript
constructor(private readonly dashboard: DashboardService) {}
```

| Method            | Parameters       | Returns                      | Description                                                                                     |
| ----------------- | ---------------- | ---------------------------- | ----------------------------------------------------------------------------------------------- |
| `snapshotForUser` | `userId: number` | `Promise<DashboardSnapshot>` | `{ pipeline, tasksOpen, tasksOverdue }` — all three queries fire in parallel via `Promise.all`. |

`DashboardSnapshot.pipeline` is `StageSummary[]` from `OpportunitiesService.pipelineSummary(userId)`. `tasksOpen` and `tasksOverdue` are `length`-counts over `ActivityLogService.findOpenForOwner(userId)` and `findOverdueForOwner(userId)`.

---

## CrmSeedService

Runs once on `OnModuleInit`. Only registered when `forRoot()` is used. Two phases:

1. **`seedLookups`** — calls `ConfigurableLookupsService.seedDefaults(DEFAULT_CRM_LOOKUPS)`. This is idempotent: existing `(listKey, value)` pairs are left alone. Newly inserted rows are tagged `is_system = 1` so they cannot be renamed or deactivated through the public API.
2. **`mapRolePermissions`** — for each role named in `CRM_ROLE_PERMISSIONS` (`admin`, `user`, `manager`), looks up the role and ensures every required permission exists in the `permissions` table (creating any that are missing), then merges the new permission IDs onto the role. Existing role-permission grants are preserved.

If any role is missing (e.g. the user-management seed hasn't run yet), the service logs a warning and continues.

`DEFAULT_CRM_LOOKUPS` covers the seven CRM lookup lists from `LOOKUP_LIST_KEYS`: `lead_status`, `lead_source`, `opportunity_stage`, `activity_type`, `contact_status`, `company_status`, and `loss_reason`. `industry` is intentionally left empty — apps decide their own industry list.

`CRM_ROLE_PERMISSIONS`:

| Role      | Permissions                                                                                                      |
| --------- | ---------------------------------------------------------------------------------------------------------------- |
| `admin`   | Full CRUD on all six CRM resources (`contacts`, `companies`, `leads`, `opportunities`, `activities`, `lookups`). |
| `user`    | `read` + `create` + `update` on records (no `delete`); `read` on `lookups`.                                      |
| `manager` | `read` only on every CRM resource.                                                                               |

---

## REST Endpoints

All endpoints require authentication and an RBAC permission.

| Method | Path                 | Permission           | Description                                                                                       |
| ------ | -------------------- | -------------------- | ------------------------------------------------------------------------------------------------- |
| `POST` | `/leads/:id/convert` | `leads:update`       | Convert a lead. Body: `ConvertLeadRequestDto`. Returns `{ lead, contact, company, opportunity }`. |
| `GET`  | `/crm/dashboard`     | `opportunities:read` | Snapshot for the authenticated user.                                                              |

---

## Usage Example

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { OpenKingdomFeatureRootSchemaModule } from '@open-kingdom/demo-scaffold-backend-feature-root-schema';
import { JwtAuthGuard, OpenKingdomFeatureBackendAuthModule } from '@open-kingdom/shared-backend-feature-authentication';
import { FeatureUserManagementModule } from '@open-kingdom/shared-backend-feature-user-management';
import { FeatureCrmModule } from '@open-kingdom/crm-backend-feature-crm';

@Module({
  imports: [
    OpenKingdomFeatureRootSchemaModule,
    OpenKingdomFeatureBackendAuthModule.forRoot({ jwtSecret: process.env.JWT_SECRET! }),
    FeatureUserManagementModule.forRoot({
      invitationTokenSecret: process.env.INVITATION_SECRET!,
      frontendBaseUrl: process.env.FRONTEND_BASE_URL!,
    }),
    FeatureCrmModule.forRoot(),
  ],
  providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}
```

---

## Testing

```bash
nx test crm-backend-feature-crm
```
