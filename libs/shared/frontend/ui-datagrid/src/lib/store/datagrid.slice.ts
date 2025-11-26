import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { GridState } from 'ag-grid-community';
import type { DataGridState } from '../datagrid.types';

const initialState: DataGridState = {
  instances: {},
  views: {},
};

export const dataGridSlice = createSlice({
  name: 'dataGrid',
  initialState,
  reducers: {
    setGridState: (
      state,
      action: PayloadAction<{ id: string; gridState: GridState }>
    ) => {
      state.instances[action.payload.id] = action.payload.gridState;
    },

    saveView: (
      state,
      action: PayloadAction<{
        id: string;
        name: string;
        gridState: GridState;
        description?: string;
      }>
    ) => {
      const { id, name, gridState, description } = action.payload;
      state.views[id] = {
        id,
        name,
        state: gridState,
        description,
        createdAt: state.views[id]?.createdAt || Date.now(),
        updatedAt: Date.now(),
      };
    },

    deleteView: (state, action: PayloadAction<string>) => {
      delete state.views[action.payload];
    },

    clearGridState: (state, action: PayloadAction<string>) => {
      delete state.instances[action.payload];
    },
  },
});

export const { setGridState, saveView, deleteView, clearGridState } =
  dataGridSlice.actions;

export const dataGridReducer = dataGridSlice.reducer;
