import { type AgGridReactProps } from "ag-grid-react";
import { type CSSProperties } from "react";

export interface DataGridProps extends AgGridReactProps {
  className?: string;
  containerStyle?: CSSProperties;
  enableRowSelection?: boolean;
}

export * from "ag-grid-community";
