import { useCallback, useMemo, useState } from 'react';
import type {
  OnChangeFn,
  RowData,
  RowSelectionState,
} from '@tanstack/react-table';
import { cn } from '@open-kingdom/shared-frontend-ui-theme';

import { DataTable } from './data-table';
import type {
  DualListBulkActionsRenderer,
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
  bulkActions,
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

  const primarySelected = useSelectedItems(primary, primarySelection);
  const secondarySelected = useSelectedItems(secondary, secondarySelection);
  const anySelected =
    primarySelected.length > 0 || secondarySelected.length > 0;

  const clearAll = useCallback(() => {
    setPrimarySelection({});
    setSecondarySelection({});
  }, []);

  return (
    <div className={cn('flex min-h-0 flex-col gap-y-4', className)}>
      {bulkActions && anySelected && (
        <UnifiedBulkActionBar
          primaryCount={primarySelected.length}
          secondaryCount={secondarySelected.length}
          render={bulkActions}
          primarySelected={primarySelected}
          secondarySelected={secondarySelected}
          clearAll={clearAll}
        />
      )}
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

function useSelectedItems<T extends RowData>(
  side: DualListSideProps<T>,
  selection: RowSelectionState
): T[] {
  const { data, getRowId } = side;

  return useMemo(() => {
    const selectedKeys = new Set(
      Object.entries(selection)
        .filter(([, isSelected]) => isSelected)
        .map(([key]) => key)
    );

    if (selectedKeys.size === 0) return [];

    return data.filter((row, index) => {
      const id = getRowId ? getRowId(row, index) : String(index);
      return selectedKeys.has(id);
    });
  }, [data, getRowId, selection]);
}

function UnifiedBulkActionBar<
  TPrimary extends RowData,
  TSecondary extends RowData
>({
  primaryCount,
  secondaryCount,
  primarySelected,
  secondarySelected,
  render,
  clearAll,
}: {
  primaryCount: number;
  secondaryCount: number;
  primarySelected: TPrimary[];
  secondarySelected: TSecondary[];
  render: DualListBulkActionsRenderer<TPrimary, TSecondary>;
  clearAll: () => void;
}) {
  const total = primaryCount + secondaryCount;

  return (
    <div
      role="region"
      aria-label={`${total} row${total === 1 ? '' : 's'} selected`}
      className="flex flex-wrap items-center gap-2 rounded-md border bg-muted px-3 py-2 text-sm"
    >
      <span className="font-medium text-foreground">
        {primaryCount > 0 && `${primaryCount} above`}
        {primaryCount > 0 && secondaryCount > 0 && ', '}
        {secondaryCount > 0 && `${secondaryCount} below`}
      </span>
      <div className="flex flex-wrap items-center gap-2">
        {render({ primarySelected, secondarySelected, clearAll })}
      </div>
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
