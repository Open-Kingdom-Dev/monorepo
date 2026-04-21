import type { Column, RowData } from '@tanstack/react-table';
import type { CSSProperties } from 'react';

/**
 * Returns the className + style needed to pin a column via CSS `position:
 * sticky`. Reads pin side and offset directly from TanStack — no manual math.
 */
export function pinSticky<T extends RowData>(
  column: Column<T, unknown>
): { className: string | undefined; style: CSSProperties | undefined } {
  const side = column.getIsPinned();
  if (side === 'left') {
    return {
      className:
        'sticky z-10 bg-background shadow-[1px_0_0_0_theme(colors.border)]',
      style: { left: `${column.getStart('left')}px` },
    };
  }
  if (side === 'right') {
    return {
      className:
        'sticky z-10 bg-background shadow-[-1px_0_0_0_theme(colors.border)]',
      style: { right: `${column.getAfter('right')}px` },
    };
  }
  return { className: undefined, style: undefined };
}
