import { useDispatch, useSelector } from 'react-redux';
import { useCallback, useMemo } from 'react';
import {
  DataGrid,
  setGridState,
  selectGridInstance,
  type StorageProvider,
  type StateUpdatedEvent,
  type GridState,
} from '@open-kingdom/shared-frontend-ui-datagrid';
import carsData from '../data/cars.json';

const localStorageProvider: StorageProvider = {
  get: async (key) => localStorage.getItem(key),
  set: async (key, value) => localStorage.setItem(key, value),
  remove: async (key) => localStorage.removeItem(key),
};

export const GridExample = () => {
  const dispatch = useDispatch();

  const savedState = useSelector(selectGridInstance('car-grid'));

  const rowData = useMemo(() => carsData.data, []);

  const colDefs = useMemo(() => carsData.columns, []);

  const handleStateUpdated = useCallback(
    (event: StateUpdatedEvent) => {
      const gridId = 'car-grid';
      const gridState = event.state;

      dispatch(setGridState({ id: gridId, gridState }));
    },
    [dispatch]
  );

  const handleStateLoaded = useCallback(
    (gridState: GridState) => {
      dispatch(setGridState({ id: 'car-grid', gridState }));
    },
    [dispatch]
  );

  return (
    <DataGrid
      rowData={rowData}
      columnDefs={colDefs}
      enableRowSelection={true}
      enableStatePersistence={true}
      storageProvider={localStorageProvider}
      storageKey="car-grid-state"
      initialState={savedState}
      onStateUpdated={handleStateUpdated}
      onStateLoaded={handleStateLoaded}
    />
  );
};
