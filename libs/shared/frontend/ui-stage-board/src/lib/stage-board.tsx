import * as React from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import { cn } from '@open-kingdom/shared-frontend-ui-theme';

export interface StageBoardColumn<TId extends string = string> {
  id: TId;
  label: string;
  description?: string;
}

export interface StageBoardProps<TCard, TColumnId extends string = string> {
  columns: ReadonlyArray<StageBoardColumn<TColumnId>>;
  cards: ReadonlyArray<TCard>;
  getCardId: (card: TCard) => string;
  getCardColumnId: (card: TCard) => TColumnId;
  renderCard: (card: TCard) => React.ReactNode;
  renderColumnSummary?: (args: {
    column: StageBoardColumn<TColumnId>;
    cards: ReadonlyArray<TCard>;
  }) => React.ReactNode;
  onCardMoved?: (args: {
    cardId: string;
    fromColumnId: TColumnId;
    toColumnId: TColumnId;
  }) => void;
  className?: string;
  columnClassName?: string;
  emptyColumnMessage?: React.ReactNode;
}

interface DroppableColumnProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

function DroppableColumn({ id, children, className }: DroppableColumnProps) {
  const { isOver, setNodeRef } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex h-full flex-col gap-2 rounded-md border border-border bg-muted/40 p-3 transition-colors',
        isOver && 'border-primary/60 bg-primary/5',
        className
      )}
      data-testid={`stage-board-column-${id}`}
    >
      {children}
    </div>
  );
}

interface DraggableCardProps {
  id: string;
  children: React.ReactNode;
}

function DraggableCard({ id, children }: DraggableCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
  });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        'cursor-grab active:cursor-grabbing rounded-md border border-border bg-card shadow-sm',
        isDragging && 'opacity-50'
      )}
      data-testid={`stage-board-card-${id}`}
    >
      {children}
    </div>
  );
}

export function StageBoard<TCard, TColumnId extends string = string>(
  props: StageBoardProps<TCard, TColumnId>
) {
  const {
    columns,
    cards,
    getCardId,
    getCardColumnId,
    renderCard,
    renderColumnSummary,
    onCardMoved,
    className,
    columnClassName,
    emptyColumnMessage,
  } = props;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  const [activeCardId, setActiveCardId] = React.useState<string | null>(null);

  const cardsById = React.useMemo(() => {
    const map = new Map<string, TCard>();
    for (const card of cards) {
      map.set(getCardId(card), card);
    }
    return map;
  }, [cards, getCardId]);

  const cardsByColumn = React.useMemo(() => {
    const byColumn = new Map<TColumnId, TCard[]>();
    for (const column of columns) {
      byColumn.set(column.id, []);
    }
    for (const card of cards) {
      const colId = getCardColumnId(card);
      const bucket = byColumn.get(colId);
      if (bucket) bucket.push(card);
    }
    return byColumn;
  }, [cards, columns, getCardColumnId]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveCardId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCardId(null);
    const { active, over } = event;
    if (!over) return;
    const cardId = String(active.id);
    const toColumnId = String(over.id) as TColumnId;
    const card = cardsById.get(cardId);
    if (!card) return;
    const fromColumnId = getCardColumnId(card);
    if (fromColumnId === toColumnId) return;
    onCardMoved?.({ cardId, fromColumnId, toColumnId });
  };

  const activeCard = activeCardId ? cardsById.get(activeCardId) : undefined;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        className={cn(
          'grid gap-3 overflow-x-auto',
          'grid-flow-col auto-cols-[minmax(16rem,1fr)]',
          className
        )}
        data-testid="stage-board"
      >
        {columns.map((column) => {
          const columnCards = cardsByColumn.get(column.id) ?? [];
          return (
            <DroppableColumn
              key={column.id}
              id={column.id}
              className={columnClassName}
            >
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground">
                  {column.label}
                </h3>
                {renderColumnSummary ? (
                  renderColumnSummary({ column, cards: columnCards })
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {columnCards.length}
                  </span>
                )}
              </div>
              {column.description && (
                <p className="text-xs text-muted-foreground">
                  {column.description}
                </p>
              )}
              <div className="flex flex-col gap-2">
                {columnCards.length === 0 ? (
                  <div className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
                    {emptyColumnMessage ?? 'No items'}
                  </div>
                ) : (
                  columnCards.map((card) => (
                    <DraggableCard key={getCardId(card)} id={getCardId(card)}>
                      {renderCard(card)}
                    </DraggableCard>
                  ))
                )}
              </div>
            </DroppableColumn>
          );
        })}
      </div>
      <DragOverlay>
        {activeCard ? (
          <div className="rounded-md border border-primary bg-card shadow-lg">
            {renderCard(activeCard)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
