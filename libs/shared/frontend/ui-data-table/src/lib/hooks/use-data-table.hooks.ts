import {
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type RowData,
  type Table,
  type TableOptions,
} from '@tanstack/react-table';

export type UseDataTableOptions<T extends RowData> = Omit<
  TableOptions<T>,
  'getCoreRowModel'
> & {
  getCoreRowModel?: TableOptions<T>['getCoreRowModel'];
};

/**
 * Thin wrapper around `useReactTable` that pre-registers the row models
 * `<DataTable />` needs unconditionally (core, sort, filter). Pagination is
 * registered by the consumer because TanStack's `getRowModel()` routes
 * through `getPaginationRowModel` whenever it's present, which would silently
 * truncate non-paginated tables to the default page size.
 *
 * Returns TanStack's native `Table<T>` unwrapped — every method on the
 * official TanStack Table API is available.
 */
export function useDataTable<T extends RowData>(
  options: UseDataTableOptions<T>
): Table<T> {
  return useReactTable<T>({
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    ...options,
  });
}
