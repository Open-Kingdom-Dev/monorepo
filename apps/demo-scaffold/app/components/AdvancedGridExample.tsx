import { useDispatch, useSelector } from 'react-redux';
import { useCallback, useRef, useState, useMemo } from 'react';
import { useMountEffect, useUpdateEffect } from '@react-hookz/web';
import {
  DataGrid,
  type DataGridTheme,
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
import { useTheme } from '@open-kingdom/shared-frontend-ui-theme';
import carsData from '../data/cars.json';

// Create a storage provider that uses localStorage
const localStorageProvider: StorageProvider = {
  get: async (key) => localStorage.getItem(key),
  set: async (key, value) => localStorage.setItem(key, value),
  remove: async (key) => localStorage.removeItem(key),
};

const VIEWS_STORAGE_KEY = 'advanced-grid-saved-views';

export const AdvancedGridExample = () => {
  const { theme, mode } = useTheme();
  const dispatch = useDispatch();
  const savedViews = useSelector(selectAllViews);
  const currentState = useSelector(selectGridInstance('advanced-grid'));
  const gridRef = useRef<GridApi | null>(null);
  const [viewToDelete, setViewToDelete] = useState<string>('');

  // Row Data: The data to be displayed from JSON file
  // IMPORTANT: Memoize to prevent re-creating on every render
  const rowData = useMemo(() => carsData.data, []);

  // Column Definitions: Loaded from JSON file
  // IMPORTANT: Memoize to prevent re-creating on every render
  const colDefs = useMemo(() => carsData.columns, []);

  // Save current grid state as a view
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

  // Load a saved view
  const handleLoadView = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const { value: viewId } = e.target;

      if (!viewId || !gridRef.current) {
        return;
      }

      const view = savedViews.find((v) => v.id === viewId);

      if (view?.state) {
        gridRef.current.setState(view.state);
        e.target.value = ''; // Reset select
      }
    },
    [savedViews]
  );

  // Confirm and delete view
  const handleConfirmDelete = useCallback(() => {
    if (viewToDelete) {
      dispatch(deleteView(viewToDelete));
      setViewToDelete('');
    }
  }, [dispatch, viewToDelete]);

  // Handle state updates - sync with Redux
  const handleStateUpdated = useCallback(
    (event: StateUpdatedEvent) => {
      const gridState = event.state;
      dispatch(setGridState({ id: 'advanced-grid', gridState }));
    },
    [dispatch]
  );

  // Handle state loaded from storage
  const handleStateLoaded = useCallback(
    (gridState: GridState) => {
      dispatch(setGridState({ id: 'advanced-grid', gridState }));
    },
    [dispatch]
  );

  // Load saved views from localStorage on mount
  useMountEffect(() => {
    const storedViews = localStorage.getItem(VIEWS_STORAGE_KEY);
    if (storedViews) {
      try {
        const views = JSON.parse(storedViews) as Record<string, DataGridView>;

        // Restore each view to Redux
        Object.values(views).forEach((view) => {
          const { id, name, state: gridState, description } = view;
          dispatch(saveView({ id, name, gridState, description }));
        });
      } catch (error) {
        console.error('Failed to load saved views:', error);
      }
    }
  });

  // Persist views to localStorage whenever they change (skip initial render)
  useUpdateEffect(() => {
    if (Object.keys(savedViews).length > 0) {
      localStorage.setItem(VIEWS_STORAGE_KEY, JSON.stringify(savedViews));
    } else {
      // Clear storage if all views are deleted
      localStorage.removeItem(VIEWS_STORAGE_KEY);
    }
  }, [savedViews]);

  return (
    <div className="flex flex-col gap-4">
      {/* View Management Toolbar */}
      <div className="flex gap-2 items-center">
        <button
          onClick={handleSaveView}
          className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Save View
        </button>

        {savedViews.length > 0 && (
          <>
            <select
              onChange={handleLoadView}
              className="px-3 py-1.5 text-sm border rounded"
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
              className="px-3 py-1.5 text-sm border rounded"
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
                <span className="text-sm text-gray-600">
                  Delete "{savedViews.find((v) => v.id === viewToDelete)?.name}
                  "?
                </span>
                <button
                  onClick={handleConfirmDelete}
                  className="px-3 py-1.5 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                >
                  Yes
                </button>
                <button
                  onClick={() => setViewToDelete('')}
                  className="px-3 py-1.5 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                >
                  No
                </button>
              </>
            )}
          </>
        )}

        <span className="ml-auto text-sm text-gray-600">
          {savedViews.length} saved view{savedViews.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Grid - matching GridExample UI */}
      <div className="flex-1">
        <DataGrid
          ref={gridRef}
          rowData={rowData}
          columnDefs={colDefs}
          mode={mode}
          theme={theme as DataGridTheme}
          enableRowSelection={true}
          // State persistence configuration
          enableStatePersistence={true}
          storageProvider={localStorageProvider}
          storageKey="advanced-grid-state"
          // Redux integration
          initialState={currentState}
          onStateUpdated={handleStateUpdated}
          onStateLoaded={handleStateLoaded}
        />
      </div>
    </div>
  );
};
