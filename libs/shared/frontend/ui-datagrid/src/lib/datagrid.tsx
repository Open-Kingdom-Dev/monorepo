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
} from './datagrid.types';
import { DataGridThemeAdapter } from './theme';
import { useGridStatePersistence } from './hooks';

ModuleRegistry.registerModules([AllCommunityModule]);

export const DataGrid = forwardRef<GridApi | null, DataGridProps>(
  (
    {
      className,
      rowSelection,
      containerStyle = containerDefaults,
      enableRowSelection = false,
      mode,
      theme,
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
    // Memoize rowSelection to prevent AG Grid from resetting on re-renders
    const rowSelectionOptions = useMemo(
      () =>
        rowSelection ||
        (enableRowSelection
          ? multiRowSelectionDefaults
          : singleRowSelectionDefaults),
      [rowSelection, enableRowSelection]
    );

    const currentTheme = DataGridThemeAdapter.adapt(theme, mode);

    // Extract initialState from props
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
        // initialState is handled via the Grid API in onGridReady
        theme={currentTheme}
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
