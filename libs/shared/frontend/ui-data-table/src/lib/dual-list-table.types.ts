import type { ReactNode } from 'react';
import type { RowData } from '@tanstack/react-table';
import type { DataTableProps } from './data-table.types';

/**
 * Per-side props. The wrapper owns row selection, so the selection-related
 * fields are stripped — consumers configure everything else (`data`, `columns`,
 * `bulkActions`, sorting, filtering, persistence, etc.) freely per side.
 */
export type DualListSideProps<T extends RowData> = Omit<
  DataTableProps<T>,
  'enableRowSelection' | 'rowSelection' | 'onRowSelectionChange'
> & {
  /** Section heading rendered above the table — typically a string or short node. */
  label?: ReactNode;
};

export type DualListTableProps<
  TPrimary extends RowData,
  TSecondary extends RowData
> = {
  primary: DualListSideProps<TPrimary>;
  secondary: DualListSideProps<TSecondary>;
  /**
   * `'exclusive'` (default): selecting on one side clears the other — the
   * canonical "act on top, row moves to bottom" flow.
   * `'independent'`: both sides hold selection at once.
   */
  selectionMode?: 'exclusive' | 'independent';
  className?: string;
};
