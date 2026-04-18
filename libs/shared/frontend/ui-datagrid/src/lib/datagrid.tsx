import { forwardRef, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import {
  gridDefaults,
  containerDefaults,
  multiRowSelectionDefaults,
  singleRowSelectionDefaults,
} from './datagrid.config';
import {
  AllCommunityModule,
  ModuleRegistry,
  DataGridProps,
  GridApi,
  themeQuartz,
} from './datagrid.types';
import { useGridStatePersistence } from './hooks';

ModuleRegistry.registerModules([AllCommunityModule]);

export const DataGrid = forwardRef<GridApi | null, DataGridProps>(
  (
    {
      className,
      rowSelection,
      containerStyle = containerDefaults,
      enableRowSelection = false,
      enableStatePersistence = false,
      storageProvider,
      storageKey = 'grid-state',
      onStateUpdated,
      onGridReady,
      onStateLoaded,
      onStatePersisted,
      ...props
    }: DataGridProps,
    ref
  ) => {
    const rowSelectionOptions = useMemo(
      () =>
        rowSelection ||
        (enableRowSelection
          ? multiRowSelectionDefaults
          : singleRowSelectionDefaults),
      [rowSelection, enableRowSelection]
    );

    const { initialState, ...restProps } = props;

    const { handleStateUpdated, handleGridReady } = useGridStatePersistence({
      ref,
      initialState,
      enableStatePersistence,
      storageProvider,
      storageKey,
      onStateUpdated,
      onGridReady,
      onStateLoaded,
      onStatePersisted,
    });

    return (
      <AgGridReact
        {...gridDefaults}
        {...restProps}
        theme={themeQuartz}
        className={className}
        containerStyle={containerStyle}
        rowSelection={rowSelectionOptions}
        onStateUpdated={handleStateUpdated}
        onGridReady={handleGridReady}
      />
    );
  }
);

DataGrid.displayName = 'DataGrid';
