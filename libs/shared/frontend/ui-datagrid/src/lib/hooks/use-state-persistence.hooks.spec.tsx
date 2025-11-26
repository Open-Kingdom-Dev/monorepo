import { renderHook, act } from '@testing-library/react';
import {
  type GridReadyEvent,
  type StateUpdatedEvent,
  type GridApi,
  type GridState,
} from 'ag-grid-community';
import { useGridStatePersistence } from './use-state-persistence.hooks';
import type { StorageProvider } from '../datagrid.types';

// Type for mock grid state
type MockGridState = Partial<GridState> & {
  rowSelection?: Record<string, boolean>;
  filter?: Record<string, unknown>;
  sort?: unknown[];
};

describe('useGridStatePersistence', () => {
  let mockStorageProvider: StorageProvider;
  let mockGridApi: GridApi;

  beforeEach(() => {
    mockStorageProvider = {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
    };

    mockGridApi = {
      setState: jest.fn(),
      getState: jest.fn(),
    } as unknown as GridApi;
  });

  describe('handleStateUpdated', () => {
    it('should skip state updates that are just clearing row selection via API', async () => {
      const onStateUpdated = jest.fn();
      const onStatePersisted = jest.fn();

      const { result } = renderHook(() =>
        useGridStatePersistence({
          enableStatePersistence: true,
          storageProvider: mockStorageProvider,
          storageKey: 'test-key',
          onStateUpdated,
          onStatePersisted,
        })
      );

      const event: StateUpdatedEvent = {
        sources: ['api'],
        state: { rowSelection: undefined } as MockGridState,
        api: mockGridApi,
        type: 'stateUpdated',
        context: {} as GridState,
      };

      await act(async () => {
        await result.current.handleStateUpdated(event);
      });

      expect(onStateUpdated).not.toHaveBeenCalled();
      expect(mockStorageProvider.set).not.toHaveBeenCalled();
    });

    it('should process state updates with row selection from user interaction', async () => {
      const onStateUpdated = jest.fn();
      const onStatePersisted = jest.fn();

      const { result } = renderHook(() =>
        useGridStatePersistence({
          enableStatePersistence: true,
          storageProvider: mockStorageProvider,
          storageKey: 'test-key',
          onStateUpdated,
          onStatePersisted,
        })
      );

      const event: StateUpdatedEvent = {
        sources: ['rowSelection'],
        state: {
          rowSelection: { '0': true },
          filter: {},
        } as MockGridState,
        api: mockGridApi,
        type: 'stateUpdated',
        context: {} as GridState,
      };

      await act(async () => {
        await result.current.handleStateUpdated(event);
      });

      expect(onStateUpdated).toHaveBeenCalledWith(
        expect.objectContaining({
          state: expect.objectContaining({
            rowSelection: undefined,
            filter: {},
          }),
        })
      );
      expect(mockStorageProvider.set).toHaveBeenCalled();
    });

    it('should handle storage provider errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockStorageProvider.set = jest
        .fn()
        .mockRejectedValue(new Error('Storage error'));

      const { result } = renderHook(() =>
        useGridStatePersistence({
          enableStatePersistence: true,
          storageProvider: mockStorageProvider,
          storageKey: 'test-key',
        })
      );

      const event: StateUpdatedEvent = {
        sources: ['filter'],
        state: { filter: {} } as MockGridState,
        api: mockGridApi,
        type: 'stateUpdated',
        context: {} as GridState,
      };

      await act(async () => {
        await result.current.handleStateUpdated(event);
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to persist grid state:',
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });

    it('should not persist when enableStatePersistence is false', async () => {
      const { result } = renderHook(() =>
        useGridStatePersistence({
          enableStatePersistence: false,
          storageProvider: mockStorageProvider,
          storageKey: 'test-key',
        })
      );

      const event: StateUpdatedEvent = {
        sources: ['filter'],
        state: { filter: {} } as MockGridState,
        api: mockGridApi,
        type: 'stateUpdated',
        context: {} as GridState,
      };

      await act(async () => {
        await result.current.handleStateUpdated(event);
      });

      expect(mockStorageProvider.set).not.toHaveBeenCalled();
    });

    it('should not persist when storageKey is missing', async () => {
      const { result } = renderHook(() =>
        useGridStatePersistence({
          enableStatePersistence: true,
          storageProvider: mockStorageProvider,
          storageKey: undefined,
        })
      );

      const event: StateUpdatedEvent = {
        sources: ['filter'],
        state: { filter: {} } as MockGridState,
        api: mockGridApi,
        type: 'stateUpdated',
        context: {} as GridState,
      };

      await act(async () => {
        await result.current.handleStateUpdated(event);
      });

      expect(mockStorageProvider.set).not.toHaveBeenCalled();
    });
  });

  describe('handleGridReady', () => {
    it('should set ref when provided as function', async () => {
      const refFunction = jest.fn();
      const { result } = renderHook(() =>
        useGridStatePersistence({
          ref: refFunction,
        })
      );

      const event: GridReadyEvent = {
        api: mockGridApi,
        type: 'gridReady',
      } as GridReadyEvent;

      await act(async () => {
        await result.current.handleGridReady(event);
      });

      expect(refFunction).toHaveBeenCalledWith(mockGridApi);
    });

    it('should set ref when provided as RefObject', async () => {
      const refObject = { current: null };
      const { result } = renderHook(() =>
        useGridStatePersistence({
          ref: refObject,
        })
      );

      const event: GridReadyEvent = {
        api: mockGridApi,
        type: 'gridReady',
      } as GridReadyEvent;

      await act(async () => {
        await result.current.handleGridReady(event);
      });

      expect(refObject.current).toBe(mockGridApi);
    });

    it('should apply initial state from props and exclude row selection', async () => {
      const onStateLoaded = jest.fn();
      const onGridReady = jest.fn();
      const initialState = {
        filter: { make: 'Tesla' },
        rowSelection: { '0': true },
      };

      const { result } = renderHook(() =>
        useGridStatePersistence({
          initialState: initialState as GridState,
          onStateLoaded,
          onGridReady,
        })
      );

      const event: GridReadyEvent = {
        api: mockGridApi,
        type: 'gridReady',
      } as GridReadyEvent;

      await act(async () => {
        await result.current.handleGridReady(event);
      });

      expect(mockGridApi.setState).toHaveBeenCalledWith({
        filter: { make: 'Tesla' },
        rowSelection: undefined,
      });
      expect(onStateLoaded).toHaveBeenCalledWith({
        filter: { make: 'Tesla' },
        rowSelection: undefined,
      });
      expect(onGridReady).toHaveBeenCalledWith(event);
    });

    it('should load state from storage when no initial state provided', async () => {
      const onStateLoaded = jest.fn();
      const storedState = JSON.stringify({
        filter: { make: 'Ford' },
        rowSelection: { '1': true },
      });
      mockStorageProvider.get = jest.fn().mockResolvedValue(storedState);

      const { result } = renderHook(() =>
        useGridStatePersistence({
          enableStatePersistence: true,
          storageProvider: mockStorageProvider,
          storageKey: 'test-key',
          onStateLoaded,
        })
      );

      const event: GridReadyEvent = {
        api: mockGridApi,
        type: 'gridReady',
      } as GridReadyEvent;

      await act(async () => {
        await result.current.handleGridReady(event);
      });

      expect(mockGridApi.setState).toHaveBeenCalledWith({
        filter: { make: 'Ford' },
        rowSelection: undefined,
      });
      expect(onStateLoaded).toHaveBeenCalledWith({
        filter: { make: 'Ford' },
        rowSelection: undefined,
      });
    });

    it('should handle storage loading errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockStorageProvider.get = jest
        .fn()
        .mockRejectedValue(new Error('Storage error'));

      const { result } = renderHook(() =>
        useGridStatePersistence({
          enableStatePersistence: true,
          storageProvider: mockStorageProvider,
          storageKey: 'test-key',
        })
      );

      const event: GridReadyEvent = {
        api: mockGridApi,
        type: 'gridReady',
      } as GridReadyEvent;

      await act(async () => {
        await result.current.handleGridReady(event);
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to load grid state:',
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });

    it('should handle invalid JSON in storage gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockStorageProvider.get = jest.fn().mockResolvedValue('invalid json');

      const { result } = renderHook(() =>
        useGridStatePersistence({
          enableStatePersistence: true,
          storageProvider: mockStorageProvider,
          storageKey: 'test-key',
        })
      );

      const event: GridReadyEvent = {
        api: mockGridApi,
        type: 'gridReady',
      } as GridReadyEvent;

      await act(async () => {
        await result.current.handleGridReady(event);
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to load grid state:',
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });

    it('should not load state when storage returns null', async () => {
      mockStorageProvider.get = jest.fn().mockResolvedValue(null);
      const onStateLoaded = jest.fn();

      const { result } = renderHook(() =>
        useGridStatePersistence({
          enableStatePersistence: true,
          storageProvider: mockStorageProvider,
          storageKey: 'test-key',
          onStateLoaded,
        })
      );

      const event: GridReadyEvent = {
        api: mockGridApi,
        type: 'gridReady',
      } as GridReadyEvent;

      await act(async () => {
        await result.current.handleGridReady(event);
      });

      expect(mockGridApi.setState).not.toHaveBeenCalled();
      expect(onStateLoaded).not.toHaveBeenCalled();
    });

    it('should only load state once on first grid ready', async () => {
      const onGridReady = jest.fn();
      const initialState = { filter: {} };

      const { result } = renderHook(() =>
        useGridStatePersistence({
          initialState: initialState as GridState,
          onGridReady,
        })
      );

      const event: GridReadyEvent = {
        api: mockGridApi,
        type: 'gridReady',
      } as GridReadyEvent;

      // First call
      await act(async () => {
        await result.current.handleGridReady(event);
      });

      // Second call
      await act(async () => {
        await result.current.handleGridReady(event);
      });

      expect(mockGridApi.setState).toHaveBeenCalledTimes(1);
      expect(onGridReady).toHaveBeenCalledTimes(2);
    });
  });

  describe('edge cases', () => {
    it('should handle missing callbacks gracefully', async () => {
      const { result } = renderHook(() => useGridStatePersistence({}));

      const stateEvent: StateUpdatedEvent = {
        sources: ['filter'],
        state: { filter: {} } as MockGridState,
        api: mockGridApi,
        type: 'stateUpdated',
        context: {} as GridState,
      };

      const gridEvent: GridReadyEvent = {
        api: mockGridApi,
        type: 'gridReady',
      } as GridReadyEvent;

      await act(async () => {
        await result.current.handleStateUpdated(stateEvent);
        await result.current.handleGridReady(gridEvent);
      });

      // Should not throw
      expect(true).toBe(true);
    });

    it('should handle multiple sources in state update', async () => {
      const onStateUpdated = jest.fn();

      const { result } = renderHook(() =>
        useGridStatePersistence({
          onStateUpdated,
        })
      );

      const event: StateUpdatedEvent = {
        sources: ['api', 'filter', 'sort'],
        state: { filter: {}, sort: { sortModel: [] } } as GridState,
        api: mockGridApi,
        type: 'stateUpdated',
        context: {} as GridState,
      };

      await act(async () => {
        await result.current.handleStateUpdated(event);
      });

      expect(onStateUpdated).toHaveBeenCalled();
    });
  });
});
