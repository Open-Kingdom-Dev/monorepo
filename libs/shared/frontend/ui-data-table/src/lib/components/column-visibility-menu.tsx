import { SlidersHorizontal } from 'lucide-react';
import type { Table } from '@tanstack/react-table';
import {
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@open-kingdom/shared-frontend-ui-primitives';

interface Props<T> {
  table: Table<T>;
}

export function ColumnVisibilityMenu<T>({ table }: Props<T>) {
  const hideableColumns = table
    .getAllLeafColumns()
    .filter((column) => column.getCanHide());

  if (hideableColumns.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <SlidersHorizontal className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
          Columns
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {hideableColumns.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.id}
            checked={column.getIsVisible()}
            onCheckedChange={(value) => column.toggleVisibility(Boolean(value))}
          >
            {typeof column.columnDef.header === 'string'
              ? column.columnDef.header
              : column.id}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
