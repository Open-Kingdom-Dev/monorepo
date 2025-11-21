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
} from './datagrid.types';
import { DataGridThemeAdapter } from './theme';

ModuleRegistry.registerModules([AllCommunityModule]);

export const DataGrid = ({
  className,
  rowSelection,
  containerStyle = containerDefaults,
  enableRowSelection = false,
  mode,
  theme,
  ...props
}: DataGridProps) => {
  const rowSelectionOptions =
    rowSelection ||
    (enableRowSelection
      ? multiRowSelectionDefaults
      : singleRowSelectionDefaults);

  const currentTheme = DataGridThemeAdapter.adapt(theme, mode);

  return (
    <AgGridReact
      {...gridDefaults}
      {...props}
      theme={currentTheme}
      className={className}
      containerStyle={containerStyle}
      rowSelection={rowSelectionOptions}
    />
  );
};
