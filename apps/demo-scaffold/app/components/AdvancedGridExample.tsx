import { useDispatch, useSelector } from 'react-redux';
import { useCallback, useRef, useState, useMemo } from 'react';
import { useMountEffect, useUpdateEffect } from '@react-hookz/web';
import {
  DataGrid,
  type DataGridView,
  saveView,
  deleteView,
  setGridState,
  selectAllViews,
  selectGridInstance,
  type StorageProvider,
  type GridApi,
  type StateUpdatedEvent,
  type GridState,
} from '@open-kingdom/shared-frontend-ui-datagrid';
import { Button } from '@open-kingdom/shared-frontend-ui-primitives';
import carsData from '../data/cars.json';

const localStorageProvider: StorageProvider = {
  get: async (key) => localStorage.getItem(key),
  set: async (key, value) => localStorage.setItem(key, value),
  remove: async (key) => localStorage.removeItem(key),
};

const VIEWS_STORAGE_KEY = 'advanced-grid-saved-views';

export const AdvancedGridExample = () => {
  const dispatch = useDispatch();
  const savedViews = useSelector(selectAllViews);
  const currentState = useSelector(selectGridInstance('advanced-grid'));
  const gridRef = useRef<GridApi | null>(null);
  const [viewToDelete, setViewToDelete] = useState<string>('');

  const rowData = useMemo(() => carsData.data, []);
  const colDefs = useMemo(() => carsData.columns, []);

  const handleSaveView = useCallback(() => {
    const viewName = prompt('Enter view name:');

    if (!viewName || !gridRef.current) {
      return;
    }

    dispatch(
      saveView({
        id: `view-${Date.now()}`,
        name: viewName,
        gridState: gridRef.current.getState(),
      })
    );
  }, [dispatch]);

  const handleLoadView = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const { value: viewId } = e.target;

      if (!viewId || !gridRef.current) {
        return;
      }

      const view = savedViews.find((v) => v.id === viewId);

      if (view?.state) {
        gridRef.current.setState(view.state);
        e.target.value = '';
      }
    },
    [savedViews]
  );

  const handleConfirmDelete = useCallback(() => {
    if (viewToDelete) {
      dispatch(deleteView(viewToDelete));
      setViewToDelete('');
    }
  }, [dispatch, viewToDelete]);

  const handleStateUpdated = useCallback(
    (event: StateUpdatedEvent) => {
      const gridState = event.state;
      dispatch(setGridState({ id: 'advanced-grid', gridState }));
    },
    [dispatch]
  );

  const handleStateLoaded = useCallback(
    (gridState: GridState) => {
      dispatch(setGridState({ id: 'advanced-grid', gridState }));
    },
    [dispatch]
  );

  useMountEffect(() => {
    const storedViews = localStorage.getItem(VIEWS_STORAGE_KEY);
    if (storedViews) {
      try {
        const views = JSON.parse(storedViews) as Record<string, DataGridView>;

        Object.values(views).forEach((view) => {
          const { id, name, state: gridState, description } = view;
          dispatch(saveView({ id, name, gridState, description }));
        });
      } catch (error) {
        console.error('Failed to load saved views:', error);
      }
    }
  });

  useUpdateEffect(() => {
    if (Object.keys(savedViews).length > 0) {
      localStorage.setItem(VIEWS_STORAGE_KEY, JSON.stringify(savedViews));
    } else {
      localStorage.removeItem(VIEWS_STORAGE_KEY);
    }
  }, [savedViews]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 items-center">
        <Button size="sm" onClick={handleSaveView}>
          Save View
        </Button>

        {savedViews.length > 0 && (
          <>
            <select
              onChange={handleLoadView}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="">Load View...</option>
              {savedViews.map((view) => (
                <option key={view.id} value={view.id}>
                  {view.name}
                </option>
              ))}
            </select>

            <select
              value={viewToDelete}
              onChange={(e) => setViewToDelete(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="">Delete View...</option>
              {savedViews.map((view) => (
                <option key={view.id} value={view.id}>
                  {view.name}
                </option>
              ))}
            </select>

            {viewToDelete && (
              <>
                <span className="text-sm text-muted-foreground">
                  Delete "{savedViews.find((v) => v.id === viewToDelete)?.name}
                  "?
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleConfirmDelete}
                >
                  Yes
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setViewToDelete('')}
                >
                  No
                </Button>
              </>
            )}
          </>
        )}

        <span className="ml-auto text-sm text-muted-foreground">
          {savedViews.length} saved view{savedViews.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex-1">
        <DataGrid
          ref={gridRef}
          rowData={rowData}
          columnDefs={colDefs}
          enableRowSelection={true}
          enableStatePersistence={true}
          storageProvider={localStorageProvider}
          storageKey="advanced-grid-state"
          initialState={currentState}
          onStateUpdated={handleStateUpdated}
          onStateLoaded={handleStateLoaded}
        />
      </div>
    </div>
  );
};
