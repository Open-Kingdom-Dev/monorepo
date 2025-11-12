import { type CSSProperties } from "react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { AgGridReact, type AgGridReactProps } from "ag-grid-react";
import { gridDefaults, containerDefaults, rowSelectionColumn } from "./datagrid.config";

ModuleRegistry.registerModules([AllCommunityModule]);

export interface DataGridProps extends AgGridReactProps {
  className?: string;
  containerStyle?: CSSProperties;
  enableRowSelection?: boolean;
}

export const DataGrid = ({ className, rowSelection, containerStyle = containerDefaults, enableRowSelection = false, ...props }: DataGridProps) => {
  const rowSelectionOptions = rowSelection || enableRowSelection ? rowSelectionColumn : undefined;

  return (
    <AgGridReact
      {...gridDefaults}
      {...props}
      className={className}
      containerStyle={containerStyle}
      rowSelection={rowSelectionOptions}
    />
  )
};
