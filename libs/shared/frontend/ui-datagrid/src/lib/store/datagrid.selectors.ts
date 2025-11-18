import { createSelector } from '@reduxjs/toolkit';
import type { DataGridState } from '../datagrid.types';

export const DataGridKey = 'dataGrid';
export type RootStateWithDataGrid = {
  [DataGridKey]: DataGridState;
};

// Default state
const defaultDataGridState: DataGridState = {
  instances: {},
  views: {},
};

// Select the entire dataGrid slice from Redux store
export const selectDataGridSlice = (state: RootStateWithDataGrid) =>
  state[DataGridKey] ?? defaultDataGridState;

// Select a specific grid instance's state by ID
export const selectGridInstance = (id: string) =>
  createSelector(
    [selectDataGridSlice],
    (dataGridSlice) => dataGridSlice.instances[id]
  );

// Select all saved views
export const selectAllViews = createSelector(
  [selectDataGridSlice],
  (dataGridSlice) => Object.values(dataGridSlice.views)
);

// Select a specific view by ID
export const selectView = (id: string) =>
  createSelector(
    [selectDataGridSlice],
    (dataGridSlice) => dataGridSlice.views[id]
  );

// Check if the dataGrid slice exists in the store
export const selectHasDataGridSlice = (state: RootStateWithDataGrid): boolean =>
  state[DataGridKey] !== undefined;
