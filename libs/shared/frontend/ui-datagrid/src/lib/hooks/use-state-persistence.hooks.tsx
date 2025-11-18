import { useCallback, useRef, RefObject } from 'react';
import type {
  GridApi,
  GridState,
  StateUpdatedEvent,
  GridReadyEvent,
} from 'ag-grid-community';
import type { StorageProvider } from '../datagrid.types';

export interface UseGridStatePersistenceParams {
  ref?: RefObject<GridApi | null> | ((instance: GridApi | null) => void) | null;
  initialState?: GridState;
  enableStatePersistence?: boolean;
  storageProvider?: StorageProvider;
  storageKey?: string;
  onStateUpdated?: (event: StateUpdatedEvent) => void;
  onGridReady?: (event: GridReadyEvent) => void;
  onStateLoaded?: (state: GridState) => void;
  onStatePersisted?: (state: GridState) => void;
}

export const useGridStatePersistence = ({
  ref,
  initialState,
  enableStatePersistence,
  storageProvider,
  storageKey,
  onStateUpdated,
  onGridReady,
  onStateLoaded,
  onStatePersisted,
}: UseGridStatePersistenceParams) => {
  const hasLoadedStateRef = useRef(false);

  const persistState = useCallback(
    async (state: GridState) => {
      if (!enableStatePersistence || !storageProvider || !storageKey) {
        return;
      }

      try {
        await storageProvider.set(storageKey, JSON.stringify(state));
        onStatePersisted?.(state);
      } catch (error) {
        console.error('Failed to persist grid state:', error);
      }
    },
    [enableStatePersistence, storageProvider, storageKey, onStatePersisted]
  );

  const setGridRef = useCallback(
    (api: GridApi) => {
      if (!ref) return;

      if (typeof ref === 'function') {
        ref(api);
      } else {
        ref.current = api;
      }
    },
    [ref]
  );

  const loadStateFromStorage =
    useCallback(async (): Promise<GridState | null> => {
      if (!enableStatePersistence || !storageProvider || !storageKey) {
        return null;
      }

      try {
        const stored = await storageProvider.get(storageKey);
        return stored ? (JSON.parse(stored) as GridState) : null;
      } catch (error) {
        console.error('Failed to load grid state:', error);
        return null;
      }
    }, [enableStatePersistence, storageProvider, storageKey]);

  const applyState = useCallback(
    (api: GridApi, state: GridState) => {
      const cleanState = removeRowSelection(state);
      api.setState(cleanState);
      onStateLoaded?.(cleanState);
    },
    [onStateLoaded]
  );

  const handleStateUpdated = useCallback(
    async (event: StateUpdatedEvent) => {
      // Skip programmatic row selection clears
      if (isApiClearingRowSelection(event)) {
        return;
      }

      // Remove row selection before processing
      const stateWithoutSelection = removeRowSelection(event.state);

      // Notify listeners with cleaned state
      onStateUpdated?.({
        ...event,
        state: stateWithoutSelection,
      });

      // Persist to storage
      await persistState(stateWithoutSelection);
    },
    [onStateUpdated, persistState]
  );

  const handleGridReady = useCallback(
    async (params: GridReadyEvent) => {
      // Set the ref
      setGridRef(params.api);

      // Prevent multiple state loads
      if (hasLoadedStateRef.current) {
        onGridReady?.(params);
        return;
      }
      hasLoadedStateRef.current = true;

      // Priority 1: Load from Redux/props
      if (initialState) {
        applyState(params.api, initialState);
      }
      // Priority 2: Load from localStorage
      else {
        const storedState = await loadStateFromStorage();
        if (storedState) {
          applyState(params.api, storedState);
        }
      }

      onGridReady?.(params);
    },
    [setGridRef, initialState, applyState, loadStateFromStorage, onGridReady]
  );

  return {
    handleStateUpdated,
    handleGridReady,
  };
};

// Removes row selection from grid state
// Row selection is transient UI state that shouldn't be persisted
const removeRowSelection = (state: GridState): GridState => ({
  ...state,
  rowSelection: undefined,
});

// Checks if a state update is just clearing row selection via API
const isApiClearingRowSelection = (event: StateUpdatedEvent): boolean => {
  return (
    event.sources?.includes('api') &&
    !event.state.rowSelection &&
    event.sources.length === 1
  );
};
