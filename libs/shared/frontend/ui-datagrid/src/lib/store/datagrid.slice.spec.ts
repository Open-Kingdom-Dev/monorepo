import type { GridState } from 'ag-grid-community';
import {
  dataGridSlice,
  dataGridReducer,
  setGridState,
  saveView,
  deleteView,
  clearGridState,
} from './datagrid.slice';
import type { DataGridState } from '../datagrid.types';

describe('datagrid slice', () => {
  describe('initial state', () => {
    it('should provide a clean slate with empty instances and views', () => {
      const state = dataGridReducer(undefined, { type: 'unknown' });

      expect(state.instances).toEqual({});
      expect(state.views).toEqual({});
      expect(Object.keys(state.instances)).toHaveLength(0);
      expect(Object.keys(state.views)).toHaveLength(0);
    });
  });

  describe('setGridState', () => {
    it('should remember grid settings when users adjust their view', () => {
      const gridState = {} as GridState;

      const newState = dataGridReducer(
        undefined,
        setGridState({ id: 'my-grid', gridState })
      );

      expect(newState.instances['my-grid']).toEqual(gridState);
    });

    it('should store settings for multiple independent grids on the same page', () => {
      const gridState1 = { id: 'state1' } as GridState;
      const gridState2 = { id: 'state2' } as GridState;

      let state = dataGridReducer(
        undefined,
        setGridState({ id: 'grid-1', gridState: gridState1 })
      );
      state = dataGridReducer(
        state,
        setGridState({ id: 'grid-2', gridState: gridState2 })
      );

      expect(state.instances['grid-1']).toEqual(gridState1);
      expect(state.instances['grid-2']).toEqual(gridState2);
    });

    it('should update existing grid settings when users make new adjustments', () => {
      const initialGridState = { initial: true } as unknown as GridState;
      const updatedGridState = { updated: true } as unknown as GridState;

      let state = dataGridReducer(
        undefined,
        setGridState({ id: 'my-grid', gridState: initialGridState })
      );
      state = dataGridReducer(
        state,
        setGridState({ id: 'my-grid', gridState: updatedGridState })
      );

      expect(state.instances['my-grid']).toEqual(updatedGridState);
      expect(state.instances['my-grid']).not.toEqual(initialGridState);
    });

    it('should keep other grid settings unchanged when updating one grid', () => {
      const gridState1 = { id: 'state1' } as GridState;
      const gridState2 = { id: 'state2' } as GridState;

      let state = dataGridReducer(
        undefined,
        setGridState({ id: 'grid-1', gridState: gridState1 })
      );
      state = dataGridReducer(
        state,
        setGridState({ id: 'grid-2', gridState: gridState2 })
      );

      const updatedGridState1 = { id: 'state1-updated' } as GridState;

      state = dataGridReducer(
        state,
        setGridState({ id: 'grid-1', gridState: updatedGridState1 })
      );

      expect(state.instances['grid-1']).toEqual(updatedGridState1);
      expect(state.instances['grid-2']).toEqual(gridState2);
    });
  });

  describe('saveView', () => {
    it('should allow users to save their preferred grid layout with a custom name', () => {
      const gridState = {} as GridState;

      const newState = dataGridReducer(
        undefined,
        saveView({
          id: 'view-1',
          name: 'My Favorite View',
          gridState,
        })
      );

      expect(newState.views['view-1']).toBeDefined();
      expect(newState.views['view-1'].name).toBe('My Favorite View');
      expect(newState.views['view-1'].state).toEqual(gridState);
    });

    it('should record when a view was first created for reference', () => {
      const gridState = {} as GridState;

      const beforeSave = Date.now();
      const newState = dataGridReducer(
        undefined,
        saveView({
          id: 'view-1',
          name: 'Test View',
          gridState,
        })
      );
      const afterSave = Date.now();

      expect(newState.views['view-1'].createdAt).toBeGreaterThanOrEqual(
        beforeSave
      );
      expect(newState.views['view-1'].createdAt).toBeLessThanOrEqual(afterSave);
    });

    it('should record when a view was last modified for tracking', () => {
      const gridState = {} as GridState;

      const beforeUpdate = Date.now();
      const newState = dataGridReducer(
        undefined,
        saveView({
          id: 'view-1',
          name: 'Test View',
          gridState,
        })
      );
      const afterUpdate = Date.now();

      expect(newState.views['view-1'].updatedAt).toBeGreaterThanOrEqual(
        beforeUpdate
      );
      expect(newState.views['view-1'].updatedAt).toBeLessThanOrEqual(
        afterUpdate
      );
    });

    it('should preserve the original creation time when updating an existing view', () => {
      const gridState = {} as GridState;

      const initialState: DataGridState = {
        instances: {},
        views: {
          'view-1': {
            id: 'view-1',
            name: 'Original Name',
            state: gridState,
            createdAt: 1000000,
            updatedAt: 1000000,
          },
        },
      };

      const updatedGridState = { updated: true } as GridState;

      const newState = dataGridReducer(
        initialState,
        saveView({
          id: 'view-1',
          name: 'Updated Name',
          gridState: updatedGridState,
        })
      );

      expect(newState.views['view-1'].createdAt).toBe(1000000);
      expect(newState.views['view-1'].updatedAt).toBeGreaterThan(1000000);
    });

    it('should allow users to add descriptive notes to their saved views', () => {
      const gridState = {} as GridState;

      const newState = dataGridReducer(
        undefined,
        saveView({
          id: 'view-1',
          name: 'Sales View',
          gridState,
          description: 'View optimized for monthly sales reports',
        })
      );

      expect(newState.views['view-1'].description).toBe(
        'View optimized for monthly sales reports'
      );
    });

    it('should update view details while maintaining view identity when users rename their saved layouts', () => {
      const gridState = {} as GridState;

      let state = dataGridReducer(
        undefined,
        saveView({
          id: 'view-1',
          name: 'Original Name',
          gridState,
        })
      );

      state = dataGridReducer(
        state,
        saveView({
          id: 'view-1',
          name: 'Updated Name',
          gridState,
        })
      );

      expect(state.views['view-1'].name).toBe('Updated Name');
      expect(state.views['view-1'].id).toBe('view-1');
    });

    it('should maintain separate storage for multiple user-created views', () => {
      const gridState1 = { id: 'state1' } as GridState;
      const gridState2 = { id: 'state2' } as GridState;

      let state = dataGridReducer(
        undefined,
        saveView({
          id: 'view-1',
          name: 'View One',
          gridState: gridState1,
        })
      );

      state = dataGridReducer(
        state,
        saveView({
          id: 'view-2',
          name: 'View Two',
          gridState: gridState2,
        })
      );

      expect(state.views['view-1'].name).toBe('View One');
      expect(state.views['view-2'].name).toBe('View Two');
      expect(Object.keys(state.views)).toHaveLength(2);
    });
  });

  describe('deleteView', () => {
    it('should remove unwanted views when users clean up their saved layouts', () => {
      const gridState = {} as GridState;

      const initialState: DataGridState = {
        instances: {},
        views: {
          'view-1': {
            id: 'view-1',
            name: 'Test View',
            state: gridState,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        },
      };

      const newState = dataGridReducer(initialState, deleteView('view-1'));

      expect(newState.views['view-1']).toBeUndefined();
    });

    it('should preserve other saved views when deleting one specific view', () => {
      const gridState = {} as GridState;

      const initialState: DataGridState = {
        instances: {},
        views: {
          'view-1': {
            id: 'view-1',
            name: 'View One',
            state: gridState,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
          'view-2': {
            id: 'view-2',
            name: 'View Two',
            state: gridState,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        },
      };

      const newState = dataGridReducer(initialState, deleteView('view-1'));

      expect(newState.views['view-1']).toBeUndefined();
      expect(newState.views['view-2']).toBeDefined();
      expect(newState.views['view-2'].name).toBe('View Two');
    });

    it('should handle deletion of non-existent views without errors', () => {
      const initialState: DataGridState = {
        instances: {},
        views: {},
      };

      const newState = dataGridReducer(
        initialState,
        deleteView('non-existent-view')
      );

      expect(newState.views).toEqual({});
    });
  });

  describe('clearGridState', () => {
    it('should reset grid settings when users want to start fresh', () => {
      const gridState = {} as GridState;

      const initialState: DataGridState = {
        instances: {
          'my-grid': gridState,
        },
        views: {},
      };

      const newState = dataGridReducer(initialState, clearGridState('my-grid'));

      expect(newState.instances['my-grid']).toBeUndefined();
    });

    it('should preserve other grid settings when clearing one specific grid', () => {
      const gridState1 = { id: 'state1' } as GridState;
      const gridState2 = { id: 'state2' } as GridState;

      const initialState: DataGridState = {
        instances: {
          'grid-1': gridState1,
          'grid-2': gridState2,
        },
        views: {},
      };

      const newState = dataGridReducer(initialState, clearGridState('grid-1'));

      expect(newState.instances['grid-1']).toBeUndefined();
      expect(newState.instances['grid-2']).toEqual(gridState2);
    });

    it('should handle clearing non-existent grid state without errors', () => {
      const initialState: DataGridState = {
        instances: {},
        views: {},
      };

      const newState = dataGridReducer(
        initialState,
        clearGridState('non-existent-grid')
      );

      expect(newState.instances).toEqual({});
    });
  });

  describe('slice configuration', () => {
    it('should provide complete slice configuration with name, actions, and reducer', () => {
      // Slice identity
      expect(dataGridSlice.name).toBe('dataGrid');

      // Actions availability
      expect(dataGridSlice.actions).toHaveProperty('setGridState');
      expect(dataGridSlice.actions).toHaveProperty('saveView');
      expect(dataGridSlice.actions).toHaveProperty('deleteView');
      expect(dataGridSlice.actions).toHaveProperty('clearGridState');

      // Action creators exported as functions
      expect(typeof setGridState).toBe('function');
      expect(typeof saveView).toBe('function');
      expect(typeof deleteView).toBe('function');
      expect(typeof clearGridState).toBe('function');

      // Reducer exported
      expect(typeof dataGridReducer).toBe('function');
    });
  });

  describe('action creator types', () => {
    it('should create properly typed actions for setting grid state', () => {
      const gridState = {} as GridState;

      const action = setGridState({ id: 'test-grid', gridState });

      expect(action.type).toBe('dataGrid/setGridState');
      expect(action.payload).toEqual({ id: 'test-grid', gridState });
    });

    it('should create properly typed actions for saving views', () => {
      const gridState = {} as GridState;

      const action = saveView({
        id: 'view-1',
        name: 'Test View',
        gridState,
      });

      expect(action.type).toBe('dataGrid/saveView');
      expect(action.payload.id).toBe('view-1');
      expect(action.payload.name).toBe('Test View');
    });

    it('should create properly typed actions for deleting views', () => {
      const action = deleteView('view-1');

      expect(action.type).toBe('dataGrid/deleteView');
      expect(action.payload).toBe('view-1');
    });

    it('should create properly typed actions for clearing grid state', () => {
      const action = clearGridState('test-grid');

      expect(action.type).toBe('dataGrid/clearGridState');
      expect(action.payload).toBe('test-grid');
    });
  });
});
