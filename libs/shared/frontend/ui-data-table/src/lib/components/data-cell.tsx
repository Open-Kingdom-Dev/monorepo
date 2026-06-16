import { flexRender, type Cell, type Column } from '@tanstack/react-table';
import { TableCell } from '@open-kingdom/shared-frontend-ui-primitives';
import { cn } from '@open-kingdom/shared-frontend-ui-theme';

import { pinSticky } from '../pin-sticky';

interface Props<T> {
  cell: Cell<T, unknown>;
}

export function DataCell<T>({ cell }: Props<T>) {
  const meta = cell.column.columnDef.meta;
  const align = meta?.align ?? 'left';
  const pin = pinSticky(cell.column as Column<unknown, unknown>);
  const tooltip =
    typeof meta?.tooltip === 'function'
      ? meta.tooltip(cell.row.original)
      : meta?.tooltip;

  return (
    <TableCell
      title={tooltip}
      style={pin.style}
      className={cn(
        align === 'center' && 'text-center',
        align === 'right' && 'text-right',
        meta?.wrapText ? 'whitespace-normal' : 'truncate whitespace-nowrap',
        pin.className,
        meta?.className
      )}
    >
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </TableCell>
  );
}
