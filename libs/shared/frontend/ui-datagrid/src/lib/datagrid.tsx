import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { AgGridReact, type AgGridReactProps } from 'ag-grid-react';

ModuleRegistry.registerModules([AllCommunityModule]);

export interface DataGridProps extends AgGridReactProps {
  className?: string;
}

export const DataGrid = ({ className, ...props }: DataGridProps) => (
  <AgGridReact {...props} className={className} />
);
