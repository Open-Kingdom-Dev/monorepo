

import React, { useMemo, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type { GridOptions } from 'ag-grid-community';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';


type GridEvents = {
  [K in keyof GridOptions as K extends `on${string}` ? K : never]: GridOptions[K];
};
type GridOptionsWithoutEvents = Omit<GridOptions, keyof GridEvents>;


export interface DataGridProps {
  options: GridOptionsWithoutEvents;
  events?: Partial<GridEvents>;
  theme?: 'light' | 'dark' | 'auto';
  className?: string;
  style?: React.CSSProperties;
}


export function DataGrid({
  options,
  events = {},
  theme = 'light',
  className = '',
  style,
}: DataGridProps) {
  const gridRef = useRef<AgGridReact>(null);

  const gridOptions = useMemo<GridOptions>(() => {
    return {
      ...options,
      ...events,
    } as GridOptions;
  }, [options, events]);

  // Determine theme class
  const themeClass = useMemo(() => {
    if (theme === 'dark') {
      return 'ag-theme-quartz-dark';
    }
    if (theme === 'light') {
      return 'ag-theme-quartz';
    }
    // Auto theme - default to light for now
    return 'ag-theme-quartz';
  }, [theme]);

 
  return (
    <div className={`${themeClass} ${className}`.trim()} style={style}>
      <AgGridReact ref={gridRef} {...gridOptions} />
    </div>
  );
}
