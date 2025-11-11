import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { AgGridReact, type AgGridReactProps } from 'ag-grid-react';

ModuleRegistry.registerModules([AllCommunityModule]);

export interface DataGridProps extends AgGridReactProps {
  className?: string;
  containerStyle?: React.CSSProperties;
}

export const DataGrid = ({ className, containerStyle = containerDefaults, ...props }: DataGridProps) => (
  <AgGridReact
    {...gridDefaults}
    {...props}
    className={className}
    containerStyle={containerStyle}
  />
);
