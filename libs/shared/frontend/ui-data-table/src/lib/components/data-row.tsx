import type { KeyboardEvent } from 'react';
import type { Row } from '@tanstack/react-table';
import { TableRow } from '@open-kingdom/shared-frontend-ui-primitives';
import { cn } from '@open-kingdom/shared-frontend-ui-theme';

import { DataCell } from './data-cell';

interface Props<T> {
  row: Row<T>;
  onClick?: (row: Row<T>) => void;
  rowHeight?: number | ((row: Row<T>) => number);
}

const INTERACTIVE_KEYS = new Set(['Enter', ' ']);

export function DataRow<T>({ row, onClick, rowHeight }: Props<T>) {
  const interactive = Boolean(onClick);
  const activate = () => onClick?.(row);
  const handleKeyDown = (event: KeyboardEvent<HTMLTableRowElement>) => {
    if (!INTERACTIVE_KEYS.has(event.key)) return;
    event.preventDefault();
    activate();
  };
  const height = typeof rowHeight === 'function' ? rowHeight(row) : rowHeight;

  return (
    <TableRow
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      data-state={row.getIsSelected() ? 'selected' : undefined}
      onClick={interactive ? activate : undefined}
      onKeyDown={interactive ? handleKeyDown : undefined}
      className={cn(
        interactive &&
          'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset'
      )}
      style={height ? { height } : undefined}
    >
      {row.getVisibleCells().map((cell) => (
        <DataCell key={cell.id} cell={cell} />
      ))}
    </TableRow>
  );
}
