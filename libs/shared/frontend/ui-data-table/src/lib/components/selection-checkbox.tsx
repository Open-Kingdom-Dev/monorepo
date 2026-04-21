import type { ColumnDef, Row, Table } from '@tanstack/react-table';
import { Checkbox } from '@open-kingdom/shared-frontend-ui-primitives';

export const SELECTION_COLUMN_ID = '__ok_select__';

interface HeaderProps<T> {
  table: Table<T>;
}

/**
 * Header checkbox — scoped to the current page using TanStack's native
 * page-level helpers. Matches AG Grid's `selectAll: 'currentPage'` behavior
 * which every real consumer uses today.
 */
export function HeaderCheckbox<T>({ table }: HeaderProps<T>) {
  const allSelected = table.getIsAllPageRowsSelected();
  const someSelected = table.getIsSomePageRowsSelected();
  const checked: boolean | 'indeterminate' = allSelected
    ? true
    : someSelected
    ? 'indeterminate'
    : false;

  return (
    <Checkbox
      checked={checked}
      onCheckedChange={(value) =>
        table.toggleAllPageRowsSelected(value === true)
      }
      onClick={(event) => event.stopPropagation()}
      aria-label="Select all rows on this page"
    />
  );
}

interface RowProps<T> {
  row: Row<T>;
}

export function RowCheckbox<T>({ row }: RowProps<T>) {
  return (
    <Checkbox
      checked={row.getIsSelected()}
      disabled={!row.getCanSelect()}
      onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
      aria-label="Select row"
    />
  );
}

/**
 * Synthesises the auto-injected selection column. Lives here so the column
 * config and the checkbox renderers it depends on stay in one file.
 */
export function createSelectionColumn<T>(): ColumnDef<T> {
  return {
    id: SELECTION_COLUMN_ID,
    header: ({ table }) => <HeaderCheckbox table={table} />,
    cell: ({ row }) => <RowCheckbox row={row} />,
    enableSorting: false,
    enableColumnFilter: false,
    enableResizing: false,
    enableHiding: false,
    enablePinning: false,
    size: 40,
    meta: { className: 'w-10' },
  };
}
