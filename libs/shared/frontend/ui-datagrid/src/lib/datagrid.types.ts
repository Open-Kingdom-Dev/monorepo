import { type AgGridReactProps } from 'ag-grid-react';
import { type CSSProperties } from 'react';
import { GridState } from 'ag-grid-community';

export interface DataGridView {
  id: string;
  name: string;
  state: GridState;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

export interface DataGridState {
  instances: Record<string, GridState>;
  views: Record<string, DataGridView>;
}

export interface StorageProvider {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

export interface DataGridProps extends Omit<AgGridReactProps, 'theme'> {
  // State persistence
  enableStatePersistence?: boolean;
  storageProvider?: StorageProvider;
  storageKey?: string;

  // Layout
  className?: string;
  containerStyle?: CSSProperties;
  enableRowSelection?: boolean;

  // State callbacks
  onStateLoaded?: (state: GridState) => void;
  onStatePersisted?: (state: GridState) => void;
}

export * from 'ag-grid-community';
