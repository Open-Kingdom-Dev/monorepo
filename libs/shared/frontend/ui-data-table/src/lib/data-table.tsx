import { useMemo } from 'react';
import {
  getPaginationRowModel,
  type ColumnDef,
  type RowData,
  type TableState,
  type Updater,
} from '@tanstack/react-table';
import {
  Table as PrimitiveTable,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@open-kingdom/shared-frontend-ui-primitives';
import { cn } from '@open-kingdom/shared-frontend-ui-theme';

import type { DataTableProps } from './data-table.types';
import { useDataTable } from './hooks/use-data-table.hooks';
import { usePersistedState } from './hooks/use-persisted-state.hooks';
import { HeaderCell } from './components/header-cell';
import { EmptyState } from './components/empty-state';
import { LoadingSkeleton } from './components/loading-skeleton';
import { Toolbar } from './components/toolbar';
import { PaginationFooter } from './components/pagination-footer';
import { BulkActionBar } from './components/bulk-action-bar';
import {
  SELECTION_COLUMN_ID,
  createSelectionColumn,
} from './components/selection-checkbox';
import { FloatingFilterRow } from './components/floating-filter-row';
import { DataRow } from './components/data-row';

const DEFAULT_PAGE_SIZES = [10, 25, 50, 100];

export function DataTable<T extends RowData>(props: DataTableProps<T>) {
  const {
    data,
    columns,
    getRowId,
    state,
    onStateChange,
    rowSelection,
    onRowSelectionChange,
    persistStateKey,
    initialColumnPinning,
    enableSorting = true,
    enableColumnFilters = false,
    enableFloatingFilters = false,
    enableGlobalFilter = false,
    globalFilterPlaceholder,
    enableColumnVisibility = false,
    enablePagination = false,
    paginationPageSizes = DEFAULT_PAGE_SIZES,
    enableRowSelection = false,
    enableColumnResizing = true,
    toolbarActions,
    bulkActions,
    skeletonRowCount = 8,
    onRowClick,
    rowHeight,
    loading,
    emptyState,
    filteredEmptyState,
    className,
    meta,
  } = props;

  const isControlled = Boolean(state && onStateChange);
  const persistenceActive = Boolean(persistStateKey && !isControlled);
  const persistence = usePersistedState(
    persistenceActive ? (persistStateKey as string) : ''
  );

  const resolvedColumns = useMemo<ColumnDef<T>[]>(
    () =>
      enableRowSelection ? [createSelectionColumn<T>(), ...columns] : columns,
    [columns, enableRowSelection]
  );

  // Compose initialState. Persisted state wins; explicit pinning seeds when
  // there's nothing persisted; the selection column always pins left.
  const initialState = useMemo(() => {
    const persisted = persistenceActive ? persistence.initial : {};
    if (persisted.columnPinning) return persisted;

    const left = [
      ...(enableRowSelection ? [SELECTION_COLUMN_ID] : []),
      ...(initialColumnPinning?.left ?? []),
    ];
    const right = initialColumnPinning?.right ?? [];
    if (left.length === 0 && right.length === 0) return persisted;

    return { ...persisted, columnPinning: { left, right } };
  }, [
    persistenceActive,
    persistence.initial,
    initialColumnPinning,
    enableRowSelection,
  ]);

  // Only pass `state` to TanStack when at least one slice is controlled.
  // Passing an empty object would put TanStack in controlled mode and
  // override its internal state with `{}` on every render.
  const composedState = useMemo<Partial<TableState> | undefined>(() => {
    if (!state && rowSelection === undefined) return undefined;
    return {
      ...(state ?? {}),
      ...(rowSelection !== undefined ? { rowSelection } : {}),
    };
  }, [state, rowSelection]);

  const table = useDataTable<T>({
    data,
    columns: resolvedColumns,
    getRowId,
    state: composedState,
    initialState,
    // Spread per-slice handlers conditionally — passing the property as
    // `undefined` is not equivalent to omitting it, since TanStack uses the
    // property's presence to flag a slice as controlled.
    ...(onRowSelectionChange ? { onRowSelectionChange } : {}),
    onStateChange: (updater: Updater<TableState>) => {
      if (isControlled && onStateChange) onStateChange(updater);
      if (!persistenceActive) return;
      const next =
        typeof updater === 'function' ? updater(table.getState()) : updater;
      // Project the slices that represent user preferences. Row selection,
      // pagination index, and page size are session concerns.
      persistence.write({
        sorting: next.sorting,
        columnOrder: next.columnOrder,
        columnFilters: next.columnFilters,
        globalFilter: next.globalFilter,
        columnSizing: next.columnSizing,
        columnVisibility: next.columnVisibility,
        columnPinning: next.columnPinning,
      });
    },
    enableSorting,
    enableColumnFilters: enableColumnFilters || enableFloatingFilters,
    enableGlobalFilter,
    globalFilterFn: 'includesString',
    enableRowSelection,
    enableColumnPinning: true,
    enableColumnResizing,
    columnResizeMode: 'onEnd',
    // Only register the pagination row model when pagination is on —
    // TanStack routes `getRowModel()` through it whenever it's present,
    // which would silently truncate non-paginated tables to the default
    // page size.
    ...(enablePagination
      ? { getPaginationRowModel: getPaginationRowModel() }
      : {}),
    meta,
  });

  const rows = table.getRowModel().rows;
  const visibleColumnCount = table.getVisibleLeafColumns().length;
  const tableState = table.getState();
  const hasActiveFilters =
    (tableState.columnFilters?.length ?? 0) > 0 ||
    Boolean(tableState.globalFilter);
  const showEmpty = !loading && rows.length === 0;
  const emptyData = showEmpty
    ? hasActiveFilters
      ? filteredEmptyState ?? emptyState
      : emptyState
    : undefined;

  return (
    <div className={cn('flex min-h-0 flex-col', className)}>
      <Toolbar
        table={table}
        enableGlobalFilter={enableGlobalFilter}
        globalFilterPlaceholder={globalFilterPlaceholder}
        enableColumnVisibility={enableColumnVisibility}
        toolbarActions={toolbarActions}
      />
      {bulkActions && <BulkActionBar table={table} render={bulkActions} />}
      <PrimitiveTable>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <HeaderCell<T>
                  key={header.id}
                  header={header}
                  enableResizing={enableColumnResizing}
                />
              ))}
            </TableRow>
          ))}
          {enableFloatingFilters && <FloatingFilterRow table={table} />}
        </TableHeader>
        <TableBody>
          {loading ? (
            <LoadingSkeleton
              columnCount={visibleColumnCount}
              rowCount={skeletonRowCount}
            />
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={visibleColumnCount}
                className="h-auto border-b-0 p-0"
              >
                {typeof emptyData === 'function' ? (
                  emptyData(table)
                ) : (
                  <EmptyState state={emptyData} />
                )}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <DataRow
                key={row.id}
                row={row}
                onClick={onRowClick}
                rowHeight={rowHeight}
              />
            ))
          )}
        </TableBody>
      </PrimitiveTable>
      {enablePagination && (
        <PaginationFooter table={table} pageSizes={paginationPageSizes} />
      )}
    </div>
  );
}
