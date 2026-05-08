# `@open-kingdom/shared-frontend-ui-stage-board`

A presentational, generic kanban-style board with drag-and-drop between columns. Built on `@dnd-kit/core`. Generic over the card type (`TCard`) and the column-id literal union (`TColumnId`), so the board doesn't care whether you're moving opportunities between pipeline stages, tasks between status lanes, or candidates between hiring stages.

The component is purely presentational — it owns no data, no Redux, no fetching, and no domain coupling. The host passes a `cards` array, declares how to identify each card and which column it belongs to, and renders the card body. Drag interactions surface as a callback; the host updates its source of truth and re-renders.

---

## Exports

| Export             | Type                               | Description                    |
| ------------------ | ---------------------------------- | ------------------------------ |
| `StageBoard`       | `<TCard, TColumnId>(props) => JSX` | The board component (generic). |
| `StageBoardProps`  | `interface<TCard, TColumnId>`      | Props for `StageBoard`.        |
| `StageBoardColumn` | `interface<TColumnId>`             | One column descriptor.         |

---

## Props

### `StageBoardProps<TCard, TColumnId extends string = string>`

| Prop                  | Type                                             | Required | Default      | Description                                                                                     |
| --------------------- | ------------------------------------------------ | -------- | ------------ | ----------------------------------------------------------------------------------------------- |
| `columns`             | `readonly StageBoardColumn<TColumnId>[]`         | Yes      | —            | Column descriptors. Render order is array order.                                                |
| `cards`               | `readonly TCard[]`                               | Yes      | —            | All cards across all columns; the component buckets them by `getCardColumnId`.                  |
| `getCardId`           | `(card: TCard) => string`                        | Yes      | —            | Stable card id used as React key and `dnd-kit` draggable id.                                    |
| `getCardColumnId`     | `(card: TCard) => TColumnId`                     | Yes      | —            | Returns the column the card currently lives in.                                                 |
| `renderCard`          | `(card: TCard) => ReactNode`                     | Yes      | —            | Card body. Wrapped by the component in a draggable container; do not add your own drag handles. |
| `renderColumnSummary` | `({ column, cards }) => ReactNode`               | No       | card count   | Summary rendered to the right of the column header. Defaults to a count of cards in the column. |
| `onCardMoved`         | `({ cardId, fromColumnId, toColumnId }) => void` | No       | —            | Fired after a drop into a different column. Drops into the same column are suppressed.          |
| `className`           | `string`                                         | No       | —            | Extra classes merged onto the outer board container.                                            |
| `columnClassName`     | `string`                                         | No       | —            | Extra classes merged onto every column.                                                         |
| `emptyColumnMessage`  | `ReactNode`                                      | No       | `'No items'` | Placeholder rendered inside an empty column. Single value applied to every empty column.        |

### `StageBoardColumn<TColumnId>`

| Property      | Type        | Required | Description                                                    |
| ------------- | ----------- | -------- | -------------------------------------------------------------- |
| `id`          | `TColumnId` | Yes      | Stable column id. The component uses this as the droppable id. |
| `label`       | `string`    | Yes      | Column header text.                                            |
| `description` | `string`    | No       | Sub-header text shown beneath the label.                       |

---

## Behavior

- **Layout** — columns render as a horizontally scrollable grid of `minmax(16rem, 1fr)` tracks. Mobile-friendly (the row scrolls; columns don't shrink below 16rem).
- **Drag activation** — uses `PointerSensor` with a `distance: 4` activation constraint, so a click doesn't start a drag.
- **Drag overlay** — while dragging, the original card dims to 50% opacity and a clone is rendered in the overlay with a primary-tinted shadow.
- **Drop handling** — when the dragged card is released over a column other than its origin, `onCardMoved` fires with the original column id (`fromColumnId`) and the target column id (`toColumnId`). Drops onto the same column or outside any column are no-ops.
- **No optimistic state** — the component does **not** mutate any internal state on drop. The host is expected to update its source of truth in the `onCardMoved` callback (locally, via a mutation, or both); the next render will reflect the new column placement. This keeps the component a pure rendering surface.

---

## Usage

### Pipeline kanban

```tsx
import { StageBoard, type StageBoardColumn } from '@open-kingdom/shared-frontend-ui-stage-board';
import { OPPORTUNITY_STAGES, type OpportunityStage } from '@open-kingdom/crm-poly-util-domain';

const columns: StageBoardColumn<OpportunityStage>[] = OPPORTUNITY_STAGES.map((stage) => ({
  id: stage,
  label: stage[0].toUpperCase() + stage.slice(1),
}));

export function PipelineBoard({ opportunities }: { opportunities: Opportunity[] }) {
  const [updateStage] = useUpdateOpportunityMutation();

  return (
    <StageBoard
      columns={columns}
      cards={opportunities}
      getCardId={(opp) => String(opp.id)}
      getCardColumnId={(opp) => opp.stage as OpportunityStage}
      renderCard={(opp) => (
        <div className="p-3">
          <p className="font-medium">{opp.title}</p>
          <p className="text-xs text-muted-foreground">${opp.estimatedValue?.toLocaleString() ?? '—'}</p>
        </div>
      )}
      renderColumnSummary={({ cards }) => (
        <span className="text-xs text-muted-foreground">
          {cards.length} · ${cards.reduce((acc, c) => acc + (c.estimatedValue ?? 0), 0).toLocaleString()}
        </span>
      )}
      onCardMoved={({ cardId, toColumnId }) => updateStage({ id: Number(cardId), body: { stage: toColumnId } })}
    />
  );
}
```

### Custom empty-column placeholder

```tsx
<StageBoard
  // …
  emptyColumnMessage={<span className="italic">Nothing in this stage</span>}
/>
```

### Tailwind classes

Uses semantic palette classes from `shared-frontend-ui-theme` (`bg-card`, `border-border`, `bg-muted/40`, `bg-primary/5`, `border-primary`, etc.). The host's Tailwind config must include this library's source files in its `content` glob.

---

## Testing

```bash
nx test shared-frontend-ui-stage-board
```
