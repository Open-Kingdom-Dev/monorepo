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

ModuleRegistry.registerModules([AllCommunityModule]);

export const DataGrid = ({
  className,
  rowSelection,
  containerStyle = containerDefaults,
  enableRowSelection = false,
  ...props
}: DataGridProps) => {
  const rowSelectionOptions =
    rowSelection ||
    (enableRowSelection
      ? multiRowSelectionDefaults
      : singleRowSelectionDefaults);

  return (
    <AgGridReact
      {...gridDefaults}
      {...props}
      className={className}
      containerStyle={containerStyle}
      rowSelection={rowSelectionOptions}
    />
  );
};
