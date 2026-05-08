# `@open-kingdom/shared-frontend-ui-record-detail`

A presentational React shell for showing the details of a single record (lead, opportunity, customer, project — anything with a title, an optional subtitle, optional status / next-action callouts, and one or more content tabs). Composes the `Card`, `Tabs`, and `CardHeader`/`CardContent` primitives from `shared-frontend-ui-primitives` into a consistent layout so detail pages across the app look the same.

The component is purely presentational — no data fetching, no Redux, no domain coupling. The host wires data into props.

---

## Exports

| Export              | Type        | Description                             |
| ------------------- | ----------- | --------------------------------------- |
| `RecordDetail`      | component   | The detail-page shell.                  |
| `RecordDetailProps` | `interface` | Props for `RecordDetail`.               |
| `RecordDetailTab`   | `interface` | One tab descriptor in the `tabs` array. |

---

## Layout

```
┌─────────────────────────────────────────────────────┐
│ <Card>                                              │
│   title              [actionsSlot]                  │
│   subtitle?                                         │
│   ──────────────────────────                        │
│   ┌──────────────┐  ┌────────────────┐              │
│   │ statusSlot?  │  │ nextActionSlot?│              │
│   └──────────────┘  └────────────────┘              │
│ </Card>                                             │
│                                                     │
│ ┌── Tabs ─────────────────────────────────┐         │
│ │ [tab 1] [tab 2] [tab 3]                 │         │
│ │ active tab content                      │         │
│ └─────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────┘
```

The status and next-action callouts render in a 2-column grid on `sm+` viewports and stack on mobile. The whole status / next-action `CardContent` block is omitted entirely when neither slot is provided.

---

## Props

### `RecordDetailProps`

| Prop             | Type                         | Required | Default      | Description                                                                       |
| ---------------- | ---------------------------- | -------- | ------------ | --------------------------------------------------------------------------------- |
| `title`          | `ReactNode`                  | Yes      | —            | Card title. Truncated with ellipsis on overflow.                                  |
| `subtitle`       | `ReactNode`                  | No       | —            | Rendered as `CardDescription` below the title.                                    |
| `statusSlot`     | `ReactNode`                  | No       | —            | Content shown in the "Status" callout. Useful for badges or short labels.         |
| `nextActionSlot` | `ReactNode`                  | No       | —            | Content shown in the "Next action" callout. Often a link or button.               |
| `actionsSlot`    | `ReactNode`                  | No       | —            | Right-aligned action group in the card header. Typically a row of `Button`s.      |
| `tabs`           | `readonly RecordDetailTab[]` | Yes      | —            | At least one tab is required — passing an empty array throws.                     |
| `defaultTabId`   | `string`                     | No       | `tabs[0].id` | Initial active tab when uncontrolled.                                             |
| `value`          | `string`                     | No       | —            | Controlled active-tab id. When provided, `onValueChange` should also be provided. |
| `onValueChange`  | `(value: string) => void`    | No       | —            | Fired when the active tab changes.                                                |
| `className`      | `string`                     | No       | —            | Extra classes merged onto the outer wrapper.                                      |

### `RecordDetailTab`

| Property   | Type        | Required | Description                                                                   |
| ---------- | ----------- | -------- | ----------------------------------------------------------------------------- |
| `id`       | `string`    | Yes      | Stable tab identifier. Used as the `<TabsTrigger>` and `<TabsContent>` value. |
| `label`    | `string`    | Yes      | Trigger label.                                                                |
| `content`  | `ReactNode` | Yes      | Body rendered inside `<TabsContent>` when this tab is active.                 |
| `disabled` | `boolean`   | No       | Disables the trigger.                                                         |

Throwing on empty `tabs` is intentional — a record with no tabs is a usage error, not a runtime fallback condition.

---

## Usage

```tsx
import { RecordDetail, type RecordDetailTab } from '@open-kingdom/shared-frontend-ui-record-detail';
import { Button } from '@open-kingdom/shared-frontend-ui-primitives';

const tabs: RecordDetailTab[] = [
  { id: 'overview', label: 'Overview', content: <OverviewTab leadId={lead.id} /> },
  { id: 'activity', label: 'Activity', content: <ActivityTab leadId={lead.id} /> },
  { id: 'audit', label: 'Audit log', content: <AuditTab leadId={lead.id} />, disabled: !canSeeAudit },
];

<RecordDetail
  title={lead.name}
  subtitle={lead.companyName ?? undefined}
  statusSlot={<StatusBadge status={lead.status} />}
  nextActionSlot={lead.nextActivity ? <NextActionLink activity={lead.nextActivity} /> : 'No follow-up scheduled'}
  actionsSlot={
    <>
      <Button variant="outline" onClick={onEdit}>
        Edit
      </Button>
      <Button onClick={onConvert}>Convert</Button>
    </>
  }
  tabs={tabs}
/>;
```

### Controlled tabs

```tsx
const [tab, setTab] = useSearchParam('tab', 'overview');

<RecordDetail value={tab} onValueChange={setTab} tabs={tabs} title={…} />;
```

### Tailwind classes

Uses semantic palette classes from `shared-frontend-ui-theme` (`bg-muted/40`, `text-foreground`, `border-border`, etc.). The host's Tailwind config must include this library's source files in its `content` glob.

---

## Testing

```bash
nx test shared-frontend-ui-record-detail
```
