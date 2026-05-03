import { useCallback, useState } from 'react';
import type {
  OnChangeFn,
  RowData,
  RowSelectionState,
} from '@tanstack/react-table';
import { cn } from '@open-kingdom/shared-frontend-ui-theme';

import { DataTable } from './data-table';
import type {
  DualListSideProps,
  DualListTableProps,
} from './dual-list-table.types';

export function DualListTable<
  TPrimary extends RowData,
  TSecondary extends RowData
>({
  primary,
  secondary,
  selectionMode = 'exclusive',
  className,
}: DualListTableProps<TPrimary, TSecondary>) {
  const [primarySelection, setPrimarySelection] = useState<RowSelectionState>(
    {}
  );
  const [secondarySelection, setSecondarySelection] =
    useState<RowSelectionState>({});

  const handlePrimaryChange = useCallback<OnChangeFn<RowSelectionState>>(
    (updater) => {
      setPrimarySelection((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        if (selectionMode === 'exclusive' && Object.keys(next).length > 0) {
          setSecondarySelection({});
        }
        return next;
      });
    },
    [selectionMode]
  );

  const handleSecondaryChange = useCallback<OnChangeFn<RowSelectionState>>(
    (updater) => {
      setSecondarySelection((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        if (selectionMode === 'exclusive' && Object.keys(next).length > 0) {
          setPrimarySelection({});
        }
        return next;
      });
    },
    [selectionMode]
  );

  return (
    <div className={cn('flex min-h-0 flex-col gap-y-4', className)}>
      <ListSection<TPrimary>
        side={primary}
        selection={primarySelection}
        onSelectionChange={handlePrimaryChange}
      />
      <ListSection<TSecondary>
        side={secondary}
        selection={secondarySelection}
        onSelectionChange={handleSecondaryChange}
      />
    </div>
  );
}

function ListSection<T extends RowData>({
  side,
  selection,
  onSelectionChange,
}: {
  side: DualListSideProps<T>;
  selection: RowSelectionState;
  onSelectionChange: OnChangeFn<RowSelectionState>;
}) {
  const { label, ...sideProps } = side;
  return (
    <div className="flex min-h-0 flex-col">
      {label !== undefined && (
        <div className="px-1 py-2 text-sm font-semibold text-foreground">
          {label}
        </div>
      )}
      <DataTable<T>
        {...sideProps}
        enableRowSelection
        rowSelection={selection}
        onRowSelectionChange={onSelectionChange}
      />
    </div>
  );
}
