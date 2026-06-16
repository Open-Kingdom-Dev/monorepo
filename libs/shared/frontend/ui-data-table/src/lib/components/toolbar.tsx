import type { ReactNode } from 'react';
import { Search } from 'lucide-react';
import type { Table } from '@tanstack/react-table';

import { FilterInput } from './filter-input';
import { ColumnVisibilityMenu } from './column-visibility-menu';

interface Props<T> {
  table: Table<T>;
  enableGlobalFilter?: boolean;
  globalFilterPlaceholder?: string;
  enableColumnVisibility?: boolean;
  toolbarActions?: (table: Table<T>) => ReactNode;
}

export function Toolbar<T>({
  table,
  enableGlobalFilter,
  globalFilterPlaceholder = 'Search',
  enableColumnVisibility,
  toolbarActions,
}: Props<T>) {
  if (!enableGlobalFilter && !toolbarActions && !enableColumnVisibility) {
    return null;
  }

  const globalFilter = (table.getState().globalFilter ?? '') as string;

  return (
    <div className="flex flex-wrap items-center gap-2 py-2">
      {enableGlobalFilter && (
        <div className="relative flex items-center">
          <Search
            className="pointer-events-none absolute left-2 h-3.5 w-3.5 text-muted-foreground"
            aria-hidden="true"
          />
          <FilterInput
            value={globalFilter}
            onChange={(value) => table.setGlobalFilter(value)}
            placeholder={globalFilterPlaceholder}
            ariaLabel={globalFilterPlaceholder}
            className="w-56 pl-7"
          />
        </div>
      )}
      {toolbarActions && (
        <div className="flex items-center gap-2">{toolbarActions(table)}</div>
      )}
      {enableColumnVisibility && (
        <div className="ml-auto">
          <ColumnVisibilityMenu table={table} />
        </div>
      )}
    </div>
  );
}
