import type { ReactNode } from 'react';
import type {
  ColumnDef,
  ColumnPinningState,
  Row,
  RowData,
  Table,
  TableState,
  Updater,
} from '@tanstack/react-table';

// Augment TanStack's ColumnMeta so consumers can opt into our styling knobs
// without bypassing the type system. Pinning is intentionally omitted —
// TanStack ships a first-class `state.columnPinning` model; consumers seed it
// via the `initialColumnPinning` prop.
declare module '@tanstack/react-table' {
  // TValue must mirror TanStack's `ColumnMeta` generic signature exactly even
  // though we don't reference it.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    align?: 'left' | 'center' | 'right';
    className?: string;
    tooltip?: string | ((row: TData) => string);
    enableFloatingFilter?: boolean;
    wrapText?: boolean;
  }
}

export type EmptyState = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};

export type BulkActionsRenderer<T> = (args: {
  selectedRows: Row<T>[];
  clearSelection: () => void;
  table: Table<T>;
}) => ReactNode;

export type DataTableProps<T> = {
  /** Row dataset. Keep referentially stable across renders (`useMemo`). */
  data: T[];
  /** Column definitions. Keep referentially stable across renders (`useMemo`). */
  columns: ColumnDef<T>[];
  /**
   * Stable per-row id resolver. Required when `enableRowSelection` is on —
   * TanStack's index-based default loses selection across reorder/filter.
   * Wrap in `useCallback` if it captures props.
   */
  getRowId?: (row: T, index: number) => string;

  // Controlled state — when supplied, persistStateKey is ignored.
  state?: Partial<TableState>;
  onStateChange?: (updater: Updater<TableState>) => void;

  // localStorage-backed state persistence (uncontrolled path only).
  persistStateKey?: string;

  // Initial column pinning. Consumers can also call `column.pin('left')` at
  // runtime via the `useDataTable` hook for imperative control.
  initialColumnPinning?: ColumnPinningState;

  // Feature toggles
  enableSorting?: boolean;
  enableColumnFilters?: boolean;
  enableFloatingFilters?: boolean;
  enableGlobalFilter?: boolean;
  globalFilterPlaceholder?: string;
  enableRowSelection?: boolean | ((row: Row<T>) => boolean);
  enablePagination?: boolean;
  paginationPageSizes?: number[];
  enableColumnResizing?: boolean;
  enableColumnVisibility?: boolean;
  skeletonRowCount?: number;

  // Slots
  toolbarActions?: (table: Table<T>) => ReactNode;
  bulkActions?: BulkActionsRenderer<T>;

  // Row behavior
  rowHeight?: number | ((row: Row<T>) => number);
  onRowClick?: (row: Row<T>) => void;

  // States
  loading?: boolean;
  emptyState?: EmptyState | ((table: Table<T>) => ReactNode);
  filteredEmptyState?: EmptyState | ((table: Table<T>) => ReactNode);

  // Misc
  className?: string;
  /**
   * Threaded as `table.options.meta` and accessible from cell renderers via
   * `cellContext.table.options.meta`. Keep referentially stable — TanStack
   * treats this as a table option and re-creates derived caches when the
   * reference changes.
   */
  meta?: Record<string, unknown>;
};
