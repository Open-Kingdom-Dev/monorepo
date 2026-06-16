import { flexRender, type Column, type Header } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { TableHead } from '@open-kingdom/shared-frontend-ui-primitives';
import { cn } from '@open-kingdom/shared-frontend-ui-theme';

import { pinSticky } from '../pin-sticky';

interface Props<T> {
  header: Header<T, unknown>;
  enableResizing?: boolean;
}

const SORT_ARIA: Record<'asc' | 'desc', 'ascending' | 'descending'> = {
  asc: 'ascending',
  desc: 'descending',
};

const SORT_ICON = { asc: ArrowUp, desc: ArrowDown } as const;

export function HeaderCell<T>({ header, enableResizing }: Props<T>) {
  const { column } = header;
  const meta = column.columnDef.meta;
  const align = meta?.align ?? 'left';
  const sortDir = column.getIsSorted();
  const canSort = column.getCanSort();
  const canResize = enableResizing && column.getCanResize();
  const pin = pinSticky(column as Column<unknown, unknown>);
  const SortGlyph = sortDir === false ? ArrowUpDown : SORT_ICON[sortDir];
  // `header.getSize()` reflects live `state.columnSizing` so resize drags
  // and persisted widths actually apply. Suppress the default 150px when no
  // explicit size was set, so unsized columns flow naturally.
  const explicitlySized = column.columnDef.size !== undefined;
  const width = explicitlySized ? header.getSize() : undefined;
  const resetSize = () => column.resetSize();

  return (
    <TableHead
      aria-sort={canSort ? (sortDir ? SORT_ARIA[sortDir] : 'none') : undefined}
      className={cn(
        'relative',
        align === 'center' && 'text-center',
        align === 'right' && 'text-right',
        pin.className,
        meta?.className
      )}
      style={{ ...(pin.style ?? {}), width }}
    >
      {canSort ? (
        <button
          type="button"
          onClick={column.getToggleSortingHandler()}
          className={cn(
            'inline-flex items-center gap-1 rounded-sm px-1 py-0.5 text-left font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            align === 'right' && 'ml-auto',
            align === 'center' && 'mx-auto'
          )}
        >
          {flexRender(column.columnDef.header, header.getContext())}
          <SortGlyph
            aria-hidden="true"
            className={cn('h-3.5 w-3.5 shrink-0', !sortDir && 'opacity-40')}
          />
        </button>
      ) : (
        <span className="px-1">
          {flexRender(column.columnDef.header, header.getContext())}
        </span>
      )}
      {canResize && (
        <span
          aria-hidden="true"
          onMouseDown={header.getResizeHandler()}
          onTouchStart={header.getResizeHandler()}
          onDoubleClick={resetSize}
          className={cn(
            'absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none bg-transparent hover:bg-border',
            column.getIsResizing() && 'bg-primary'
          )}
        />
      )}
    </TableHead>
  );
}
