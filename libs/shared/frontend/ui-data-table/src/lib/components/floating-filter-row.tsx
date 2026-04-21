import type { Column, Table } from '@tanstack/react-table';
import {
  TableHead,
  TableRow,
} from '@open-kingdom/shared-frontend-ui-primitives';
import { cn } from '@open-kingdom/shared-frontend-ui-theme';

import { FilterInput } from './filter-input';
import { pinSticky } from '../pin-sticky';

interface Props<T> {
  table: Table<T>;
}

export function FloatingFilterRow<T>({ table }: Props<T>) {
  return (
    <TableRow>
      {table.getVisibleLeafColumns().map((column) => (
        <FloatingFilterCell key={column.id} column={column} />
      ))}
    </TableRow>
  );
}

interface CellProps<T> {
  column: Column<T, unknown>;
}

function FloatingFilterCell<T>({ column }: CellProps<T>) {
  const pin = pinSticky(column as Column<unknown, unknown>);
  const meta = column.columnDef.meta;
  const showFilter =
    meta?.enableFloatingFilter !== false && column.getCanFilter();
  const headerLabel =
    typeof column.columnDef.header === 'string'
      ? column.columnDef.header
      : column.id;
  const filterValue = (column.getFilterValue() as string | undefined) ?? '';

  const handleChange = (value: string) =>
    column.setFilterValue(value === '' ? undefined : value);

  return (
    <TableHead className={cn('py-1', pin.className)} style={pin.style}>
      {showFilter && (
        <FilterInput
          value={filterValue}
          onChange={handleChange}
          ariaLabel={`Filter ${headerLabel}`}
          placeholder="Filter"
        />
      )}
    </TableHead>
  );
}
