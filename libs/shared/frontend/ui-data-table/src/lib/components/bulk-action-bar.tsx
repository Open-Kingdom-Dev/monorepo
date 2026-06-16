import type { Row, Table } from '@tanstack/react-table';
import { cn } from '@open-kingdom/shared-frontend-ui-theme';
import type { BulkActionsRenderer } from '../data-table.types';

interface Props<T> {
  table: Table<T>;
  render: BulkActionsRenderer<T>;
  className?: string;
}

export function BulkActionBar<T>({ table, render, className }: Props<T>) {
  const selectedRows = table.getSelectedRowModel().rows as Row<T>[];
  if (selectedRows.length === 0) return null;

  return (
    <div
      role="region"
      aria-label={`${selectedRows.length} row${
        selectedRows.length === 1 ? '' : 's'
      } selected`}
      className={cn(
        'flex flex-wrap items-center gap-2 rounded-md border bg-muted px-3 py-2 text-sm',
        className
      )}
    >
      <span className="font-medium text-foreground">
        {selectedRows.length} selected
      </span>
      <div className="flex flex-wrap items-center gap-2">
        {render({
          selectedRows,
          clearSelection: () => table.resetRowSelection(),
          table,
        })}
      </div>
    </div>
  );
}
