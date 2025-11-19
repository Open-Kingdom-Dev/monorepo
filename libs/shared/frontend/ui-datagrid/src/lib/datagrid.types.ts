import { type AgGridReactProps } from 'ag-grid-react';
import { type CSSProperties } from 'react';
import { type DataGridTheme, type ThemeMode } from './theme';

export interface DataGridProps extends Omit<AgGridReactProps, 'theme'> {
  className?: string;
  containerStyle?: CSSProperties;
  enableRowSelection?: boolean;
  mode?: ThemeMode;
  theme?: DataGridTheme;
}

export * from 'ag-grid-community';
