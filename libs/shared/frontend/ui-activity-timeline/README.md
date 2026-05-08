# `@open-kingdom/shared-frontend-ui-activity-timeline`

A presentational React component that renders a vertical, icon-bulleted timeline of activity entries — generic over the activity-type vocabulary. Each entry shows an icon for the activity type (looked up from a host-supplied `iconMap`), the subject, a timestamp (the completion or due date if available, otherwise the creation time), an optional owner label, the description body, and visual treatment for completed and overdue states.

This library is **domain-agnostic**. The component is generic over `TType extends string`, and the host application supplies the icon and label vocabularies as props. Use it for CRM activity feeds (note/call/meeting/email/task), issue-tracker comment streams, audit logs, or any other timeline-shaped UI.

The component is purely presentational — it has no data fetching, no Redux coupling, no async behavior.

---

## Exports

| Export                  | Type                                   | Description                                                         |
| ----------------------- | -------------------------------------- | ------------------------------------------------------------------- |
| `ActivityTimeline`      | `<TType extends string>(props) => JSX` | The timeline component (generic over the activity-type vocabulary). |
| `ActivityTimelineProps` | `interface<TType>`                     | Props shape for `ActivityTimeline`.                                 |
| `ActivityTimelineEntry` | `interface<TType>`                     | One row in the `entries` array.                                     |

---

## Props

### `ActivityTimelineProps<TType extends string = string>`

| Prop              | Type                                      | Required | Default                 | Description                                                                                                     |
| ----------------- | ----------------------------------------- | -------- | ----------------------- | --------------------------------------------------------------------------------------------------------------- |
| `entries`         | `readonly ActivityTimelineEntry<TType>[]` | Yes      | —                       | The activity entries to render. Render order is the array order.                                                |
| `iconMap`         | `Partial<Record<TType, LucideIcon>>`      | No       | `{}`                    | Map from `entry.type` to the `lucide-react` icon rendered in the bullet. Missing entries fall back to `Circle`. |
| `labelMap`        | `Partial<Record<TType, string>>`          | No       | —                       | Map from `entry.type` to the displayed label. Missing entries fall back to the raw `entry.type` string.         |
| `className`       | `string`                                  | No       | —                       | Extra classes merged onto the outer `<ol>` (or onto the empty-state `<div>` when `entries.length === 0`).       |
| `emptyState`      | `ReactNode`                               | No       | `'No activity yet.'`    | Custom content shown when `entries` is empty. Renders inside a dashed border placeholder.                       |
| `formatTimestamp` | `(date: Date) => string`                  | No       | `date.toLocaleString()` | Format function for the timestamp shown next to each entry's subject.                                           |
| `ref`             | `Ref<HTMLOListElement>`                   | No       | —                       | Optional ref forwarded to the outer `<ol>` (React 19's `ref` as a regular prop).                                |

### `ActivityTimelineEntry<TType extends string = string>`

| Property      | Type               | Required | Description                                                                                                             |
| ------------- | ------------------ | -------- | ----------------------------------------------------------------------------------------------------------------------- |
| `id`          | `string \| number` | Yes      | Stable React key.                                                                                                       |
| `type`        | `TType`            | Yes      | Drives icon (via `iconMap`) and label (via `labelMap`). The host supplies the type union by parameterizing the generic. |
| `subject`     | `string`           | Yes      | Headline text.                                                                                                          |
| `description` | `string \| null`   | No       | Long-form body. Rendered with `whitespace-pre-wrap` so newlines are preserved.                                          |
| `timestamp`   | `Date`             | Yes      | Fallback timestamp when neither `completedAt` nor `dueAt` is set.                                                       |
| `dueAt`       | `Date \| null`     | No       | When set and not yet `completedAt`, the entry is considered "planned"; if `dueAt` is in the past, it's "overdue".       |
| `completedAt` | `Date \| null`     | No       | When set, the entry renders as completed (filled icon, primary color).                                                  |
| `ownerLabel`  | `string`           | No       | Owner name shown after the type label, separated by a middle dot.                                                       |

---

## Visual States

| State     | Trigger                                            | Treatment                                                                                                                     |
| --------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Open      | `dueAt` not set, `completedAt` not set             | Type icon in muted bubble, no status icon next to the type label.                                                             |
| Planned   | `dueAt` set, `completedAt` not set, `dueAt >= now` | Empty `Circle` icon next to the type label.                                                                                   |
| Overdue   | `dueAt` set, `completedAt` not set, `dueAt < now`  | Border tinted destructive, icon bubble in destructive color, "· Overdue" appended to the metadata row.                        |
| Completed | `completedAt` set                                  | `CheckCircle2` icon next to the type label, icon bubble in primary tint. The completion timestamp is the displayed timestamp. |

The displayed timestamp is the first of `completedAt`, `dueAt`, `timestamp` that is set.

---

## Iconography is host-supplied

The component does **not** ship with any icons or labels. The host application supplies an `iconMap` and `labelMap` keyed on whatever activity-type vocabulary it uses. A typical CRM wiring looks like:

```tsx
import { FileText, Mail, Phone, StickyNote, Users, type LucideIcon } from 'lucide-react';
import type { ActivityType } from '@open-kingdom/crm-poly-util-domain';

const ICON_MAP: Record<ActivityType, LucideIcon> = {
  note: StickyNote,
  call: Phone,
  meeting: Users,
  email: Mail,
  task: FileText,
};
const LABEL_MAP: Record<ActivityType, string> = {
  note: 'Note',
  call: 'Call',
  meeting: 'Meeting',
  email: 'Email',
  task: 'Task',
};
```

The `OpenKingdom` CRM ships these maps in `@open-kingdom/crm-frontend-feature-crm` as `CRM_ACTIVITY_ICON_MAP` and `CRM_ACTIVITY_LABEL_MAP` for convenience.

---

## Usage

```tsx
import { ActivityTimeline, type ActivityTimelineEntry } from '@open-kingdom/shared-frontend-ui-activity-timeline';
import { Phone, FileText, type LucideIcon } from 'lucide-react';

type CrmActivity = 'call' | 'task';

const ICON_MAP: Record<CrmActivity, LucideIcon> = { call: Phone, task: FileText };
const LABEL_MAP: Record<CrmActivity, string> = { call: 'Call', task: 'Task' };

const entries: ActivityTimelineEntry<CrmActivity>[] = [
  {
    id: 1,
    type: 'call',
    subject: 'Discovery call with Acme',
    description: 'Walked through the proposal. Next step: send pricing.',
    timestamp: new Date('2026-05-04T15:00:00Z'),
    completedAt: new Date('2026-05-04T15:30:00Z'),
    ownerLabel: 'Alex',
  },
  {
    id: 2,
    type: 'task',
    subject: 'Send pricing PDF',
    timestamp: new Date('2026-05-05T09:00:00Z'),
    dueAt: new Date('2026-05-08T17:00:00Z'),
    ownerLabel: 'Alex',
  },
];

export function LeadActivityTab() {
  return <ActivityTimeline entries={entries} iconMap={ICON_MAP} labelMap={LABEL_MAP} formatTimestamp={(d) => d.toLocaleDateString(undefined, { dateStyle: 'medium' })} emptyState="No activity logged on this lead yet." />;
}
```

### Accessibility

The component renders an `<ol>`; entries are `<li>` elements so screen readers announce position and count. Decorative icons are marked `aria-hidden`. Timestamps use `<time>` (without `dateTime` — pass a formatted string, not a date string).

### Tailwind classes

Uses semantic palette classes from `shared-frontend-ui-theme` (`bg-card`, `border-border`, `text-foreground`, `text-muted-foreground`, `text-primary`, `bg-destructive/10`, etc.). The host's Tailwind config must include this library's source files in its `content` glob so the classes used here are emitted in the bundle.

---

## Testing

```bash
nx test shared-frontend-ui-activity-timeline
```
