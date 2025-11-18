import { useDispatch, useSelector } from 'react-redux';
import { useCallback, useMemo } from 'react';
import {
  DataGrid,
  type DataGridTheme,
  setGridState,
  selectGridInstance,
  type StorageProvider,
  type StateUpdatedEvent,
  type GridState,
} from '@open-kingdom/shared-frontend-ui-datagrid';
import { useTheme } from '@open-kingdom/shared-frontend-ui-theme';
import carsData from '../data/cars.json';

// Create a storage provider that uses localStorage
const localStorageProvider: StorageProvider = {
  get: async (key) => localStorage.getItem(key),
  set: async (key, value) => localStorage.setItem(key, value),
  remove: async (key) => localStorage.removeItem(key),
};

export const GridExample = () => {
  const { theme, mode } = useTheme();
  const dispatch = useDispatch();

  // Get saved state from Redux for this specific grid
  const savedState = useSelector(selectGridInstance('car-grid'));

  // Row Data: The data to be displayed from JSON file
  // IMPORTANT: Memoize to prevent re-creating on every render
  const rowData = useMemo(() => carsData.data, []);

  // Column Definitions: Loaded from JSON file
  // IMPORTANT: Memoize to prevent re-creating on every render
  const colDefs = useMemo(() => carsData.columns, []);

  // Handle state updates - sync with Redux
  const handleStateUpdated = useCallback(
    (event: StateUpdatedEvent) => {
      const gridId = 'car-grid';
      const gridState = event.state;

      dispatch(setGridState({ id: gridId, gridState }));
    },
    [dispatch]
  );

  // Handle state loaded from storage - sync with Redux
  const handleStateLoaded = useCallback(
    (gridState: GridState) => {
      dispatch(setGridState({ id: 'car-grid', gridState }));
    },
    [dispatch]
  );

  // Container: Grid with state persistence and Redux integration
  return (
    <DataGrid
      rowData={rowData}
      columnDefs={colDefs}
      mode={mode}
      theme={theme as DataGridTheme}
      enableRowSelection={true}
      // State persistence configuration
      enableStatePersistence={true}
      storageProvider={localStorageProvider}
      storageKey="car-grid-state"
      // Redux integration
      initialState={savedState}
      onStateUpdated={handleStateUpdated}
      onStateLoaded={handleStateLoaded}
    />
  );
};
