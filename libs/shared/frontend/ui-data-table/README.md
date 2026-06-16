# @open-kingdom/shared-frontend-ui-data-table

React data table on [TanStack Table v8](https://tanstack.com/table/v8) + shadcn primitives. Replaces the deprecated `@open-kingdom/shared-frontend-ui-datagrid`.

## Quickstart

```tsx
import { useMemo } from 'react';
import { DataTable, type ColumnDef } from '@open-kingdom/shared-frontend-ui-data-table';

interface User {
  id: string;
  email: string;
  status: 'active' | 'invited';
}

export function UserList({ users }: { users: User[] }) {
  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      { id: 'email', accessorKey: 'email', header: 'Email' },
      { id: 'status', accessorKey: 'status', header: 'Status' },
    ],
    []
  );
  return <DataTable<User> data={users} columns={columns} getRowId={(u) => u.id} />;
}
```

`data` and `columns` must be referentially stable — wrap them in `useMemo`.

## Features

Toggle on as needed:

- `enableSorting` (default `true`)
- `enableGlobalFilter` + `globalFilterPlaceholder`
- `enableColumnFilters` / `enableFloatingFilters`
- `enableColumnVisibility` (renders a toggle in the toolbar)
- `enableColumnResizing` (default `true`)
- `enableRowSelection` (auto-injects a checkbox column, header checkbox is page-scoped)
- `enablePagination` + `paginationPageSizes` (default `[10, 25, 50, 100]`)
- `initialColumnPinning={{ left, right }}`
- `rowHeight` — `number | (row) => number` for dynamic heights
- `loading` + `skeletonRowCount`
- `emptyState` / `filteredEmptyState` — `{ icon?, title, description?, action? } | (table) => ReactNode`
- `onRowClick` — makes rows keyboard-activatable (`Enter` / `Space`)
- `persistStateKey` — saves sort / filters / column order / sizing / visibility / pinning to `localStorage`

## Bulk actions

The `bulkActions` slot renders above the table when selection > 0:

```tsx
<DataTable<User> data={users} columns={columns} getRowId={(u) => u.id} enableRowSelection bulkActions={({ selectedRows, clearSelection }) => <Button onClick={() => deactivate(selectedRows.map((r) => r.original.id))}>Deactivate {selectedRows.length}</Button>} />
```

## Imperative access

For flows outside the table (e.g. a parent toolbar), use `useDataTable` to get the live `Table<T>`:

```tsx
import { useDataTable } from '@open-kingdom/shared-frontend-ui-data-table';

const table = useDataTable<User>({ data, columns, getRowId: (u) => u.id });
```

## Column meta

Per-column knobs live on `ColumnMeta` (TanStack augmentation):

| Key                    | Type                            | Purpose                                                |
| ---------------------- | ------------------------------- | ------------------------------------------------------ |
| `align`                | `'left' \| 'center' \| 'right'` | Header + cell text alignment                           |
| `className`            | `string`                        | Applied to both `<th>` and `<td>`                      |
| `tooltip`              | `string \| ((row) => string)`   | Cell `title` attribute                                 |
| `enableFloatingFilter` | `boolean`                       | Per-column opt-out from the floating filter row        |
| `wrapText`             | `boolean`                       | Switch from `nowrap` + ellipsis to `whitespace-normal` |

## Migrating from `ui-datagrid`

| Old                                   | New                                              |
| ------------------------------------- | ------------------------------------------------ |
| `rowData`                             | `data`                                           |
| `columnDefs`                          | `columns`                                        |
| `ColDef<T>`                           | `ColumnDef<T>`                                   |
| `ICellRendererParams<T>`              | `CellContext<T>`                                 |
| `params.data`                         | `params.row.original`                            |
| `gridApi.getSelectedRows()`           | `bulkActions` receives `selectedRows`            |
| `gridApi.deselectAll()`               | `bulkActions` receives `clearSelection`          |
| `colDef.pinned: 'left'`               | `initialColumnPinning={{ left: [columnId] }}`    |
| `floatingFilter: true`                | `enableFloatingFilters`                          |
| `quickFilterText`                     | `enableGlobalFilter` + `globalFilterPlaceholder` |
| `pagination` + `paginationPageSize`   | `enablePagination` + `paginationPageSizes`       |
| `comparator` on column                | `sortingFn` on column                            |
| `tooltipField` / `tooltipValueGetter` | `meta.tooltip`                                   |
| `cellClass` (string)                  | `meta.className`                                 |

## Limitations

Flat columns only (no group headers / footers), no row virtualization, no server-side data. Open an issue if you need any of these.
