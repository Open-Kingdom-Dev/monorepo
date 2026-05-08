# `@open-kingdom/crm-poly-util-domain`

The CRM domain vocabulary — string-literal unions, `as const` arrays, and runtime type guards for every CRM-wide enum (lead status, opportunity stage, activity type, related-entity type, lookup list keys). Pure isomorphic code with no NestJS, React, or framework dependencies; safe to import from backend, frontend, and other poly libs.

This package is the single source of truth for these vocabularies. Backend Drizzle schemas and DTOs validate against its type guards; frontend components consume its types for prop typing; the CRM seed service uses `LOOKUP_LIST_KEYS` to populate the `configurable_lookups` table on startup.

---

## Exports

### Lead Status

| Export                   | Kind                      | Description                                                      |
| ------------------------ | ------------------------- | ---------------------------------------------------------------- |
| `LEAD_STATUSES`          | `readonly LeadStatus[]`   | `['new', 'contacted', 'qualified', 'unqualified']`               |
| `LeadStatus`             | `type`                    | `'new' \| 'contacted' \| 'qualified' \| 'unqualified'`           |
| `TERMINAL_LEAD_STATUSES` | `readonly LeadStatus[]`   | `['qualified', 'unqualified']` — statuses that close out a lead. |
| `isTerminalLeadStatus`   | `(LeadStatus) => boolean` | Returns `true` if the status is `qualified` or `unqualified`.    |

### Opportunity Stage

| Export                        | Kind                            | Description                                                      |
| ----------------------------- | ------------------------------- | ---------------------------------------------------------------- |
| `OPPORTUNITY_STAGES`          | `readonly OpportunityStage[]`   | `['new', 'discovery', 'proposal', 'negotiation', 'won', 'lost']` |
| `OpportunityStage`            | `type`                          | Union of the six stage strings.                                  |
| `TERMINAL_OPPORTUNITY_STAGES` | `readonly OpportunityStage[]`   | `['won', 'lost']` — stages that close an opportunity.            |
| `isTerminalOpportunityStage`  | `(OpportunityStage) => boolean` | Returns `true` for `won` or `lost`.                              |
| `isWonStage`                  | `(OpportunityStage) => boolean` | Returns `true` only for `'won'`.                                 |
| `isLostStage`                 | `(OpportunityStage) => boolean` | Returns `true` only for `'lost'`.                                |

### Activity Type

| Export                         | Kind                                 | Description                                                                            |
| ------------------------------ | ------------------------------------ | -------------------------------------------------------------------------------------- |
| `ACTIVITY_TYPES`               | `readonly ActivityType[]`            | `['note', 'call', 'meeting', 'email', 'task']`                                         |
| `ActivityType`                 | `type`                               | Union of the five activity type strings.                                               |
| `isActivityType`               | `(unknown) => value is ActivityType` | Type guard — returns `true` for any of the five canonical values.                      |
| `ACTIVITY_TYPES_WITH_DUE_DATE` | `readonly ActivityType[]`            | `['task', 'call', 'meeting']` — activity types where a due date is meaningful.         |
| `supportsDueDate`              | `(ActivityType) => boolean`          | Returns `true` if the activity type can carry a `dueAt` date (task, call, or meeting). |

### Related Entity Type

| Export                 | Kind                                      | Description                                                                         |
| ---------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------- |
| `RELATED_ENTITY_TYPES` | `readonly RelatedEntityType[]`            | `['contact', 'company', 'lead', 'opportunity']`                                     |
| `RelatedEntityType`    | `type`                                    | Union used by the polymorphic `relatedType` column on `activity_log` (and similar). |
| `isRelatedEntityType`  | `(unknown) => value is RelatedEntityType` | Type guard for the four CRM entity kinds.                                           |

### Lookup List Keys

| Export                 | Kind                       | Description                                                                                |
| ---------------------- | -------------------------- | ------------------------------------------------------------------------------------------ |
| `LOOKUP_LIST_KEYS`     | `const object`             | Map of canonical list-name constants used by `configurable_lookups` rows. See table below. |
| `LookupListKey`        | `type`                     | Union of all lookup-list key string values.                                                |
| `ALL_LOOKUP_LIST_KEYS` | `readonly LookupListKey[]` | Array form of `LOOKUP_LIST_KEYS` values, useful for iterating during seeding.              |

`LOOKUP_LIST_KEYS` members:

| Constant            | Value                 | Used For                                                     |
| ------------------- | --------------------- | ------------------------------------------------------------ |
| `LEAD_STATUS`       | `'lead_status'`       | Lead status dropdown options (admin-configurable).           |
| `LEAD_SOURCE`       | `'lead_source'`       | Lead source dropdown (e.g. `Web`, `Referral`, `Trade Show`). |
| `OPPORTUNITY_STAGE` | `'opportunity_stage'` | Pipeline stage dropdown.                                     |
| `ACTIVITY_TYPE`     | `'activity_type'`     | Activity type dropdown.                                      |
| `CONTACT_STATUS`    | `'contact_status'`    | Contact status dropdown.                                     |
| `COMPANY_STATUS`    | `'company_status'`    | Company status dropdown.                                     |
| `INDUSTRY`          | `'industry'`          | Industry classifier on companies.                            |
| `LOSS_REASON`       | `'loss_reason'`       | Reasons attached to lost opportunities.                      |

---

## Usage

### Validating polymorphic identifiers in a service

```typescript
import { isActivityType, isRelatedEntityType } from '@open-kingdom/crm-poly-util-domain';

if (!isRelatedEntityType(input.relatedType)) {
  throw new BadRequestException(`Unknown relatedType '${input.relatedType}'`);
}
if (!isActivityType(input.type)) {
  throw new BadRequestException(`Unknown activity type '${input.type}'`);
}
```

### Typing a Drizzle column

```typescript
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import type { OpportunityStage } from '@open-kingdom/crm-poly-util-domain';

export const opportunities = sqliteTable('opportunities', {
  // …
  stage: text('stage').$type<OpportunityStage>().notNull().default('new'),
});
```

### Seeding the `configurable_lookups` table

```typescript
import { LOOKUP_LIST_KEYS, LEAD_STATUSES, OPPORTUNITY_STAGES } from '@open-kingdom/crm-poly-util-domain';

await seedLookupList(LOOKUP_LIST_KEYS.LEAD_STATUS, LEAD_STATUSES);
await seedLookupList(LOOKUP_LIST_KEYS.OPPORTUNITY_STAGE, OPPORTUNITY_STAGES);
```

### Frontend dropdown options

```tsx
import { OPPORTUNITY_STAGES } from '@open-kingdom/crm-poly-util-domain';

<select>
  {OPPORTUNITY_STAGES.map((stage) => (
    <option key={stage} value={stage}>
      {stage}
    </option>
  ))}
</select>;
```

---

## Design Notes

- All vocabularies are declared with `as const` so the inferred string-literal union is exact — adding a new value to the array automatically widens the type.
- Type guards (`is*` functions) accept `unknown` and narrow to the union, which is the supported pattern for validating untrusted input (request bodies, URL params, lookup-table reads).
- This package has zero runtime dependencies other than `tslib` and is safe to import from any environment.

---

## Testing

```bash
nx test crm-poly-util-domain
```
