import type { GridState } from 'ag-grid-community';
import {
  selectDataGridSlice,
  selectGridInstance,
  selectAllViews,
  selectView,
  selectHasDataGridSlice,
  DataGridKey,
  type RootStateWithDataGrid,
} from './datagrid.selectors';
import type { DataGridState } from '../datagrid.types';

describe('datagrid selectors', () => {
  describe('selectDataGridSlice', () => {
    it('should retrieve the entire data grid section from the application state', () => {
      const dataGridState: DataGridState = {
        instances: {
          'grid-1': {} as GridState,
        },
        views: {},
      };

      const state: RootStateWithDataGrid = {
        [DataGridKey]: dataGridState,
      };

      const result = selectDataGridSlice(state);

      expect(result).toEqual(dataGridState);
    });

    it('should provide default empty state when data grid has not been initialized', () => {
      const state = {} as RootStateWithDataGrid;

      const result = selectDataGridSlice(state);

      expect(result).toEqual({
        instances: {},
        views: {},
      });
    });

    it('should safely handle missing state without throwing errors', () => {
      const state = {} as RootStateWithDataGrid;

      expect(() => selectDataGridSlice(state)).not.toThrow();
    });

    it('should return consistent results when called multiple times with the same state', () => {
      const dataGridState: DataGridState = {
        instances: {},
        views: {},
      };

      const state: RootStateWithDataGrid = {
        [DataGridKey]: dataGridState,
      };

      const result1 = selectDataGridSlice(state);
      const result2 = selectDataGridSlice(state);

      expect(result1).toBe(result2);
    });
  });

  describe('selectGridInstance', () => {
    it('should retrieve saved settings for a specific grid when users return to a page', () => {
      const gridState = { setting: 'value' } as unknown as GridState;
      const dataGridState: DataGridState = {
        instances: {
          'my-grid': gridState,
        },
        views: {},
      };

      const state: RootStateWithDataGrid = {
        [DataGridKey]: dataGridState,
      };

      const selector = selectGridInstance('my-grid');
      const result = selector(state);

      expect(result).toEqual(gridState);
    });

    it('should return nothing when requesting settings for a grid that has not been configured', () => {
      const dataGridState: DataGridState = {
        instances: {},
        views: {},
      };

      const state: RootStateWithDataGrid = {
        [DataGridKey]: dataGridState,
      };

      const selector = selectGridInstance('non-existent-grid');
      const result = selector(state);

      expect(result).toBeUndefined();
    });

    it('should distinguish between different grids on the same page', () => {
      const gridState1 = { id: 'grid1' } as unknown as GridState;
      const gridState2 = { id: 'grid2' } as unknown as GridState;

      const dataGridState: DataGridState = {
        instances: {
          'grid-1': gridState1,
          'grid-2': gridState2,
        },
        views: {},
      };

      const state: RootStateWithDataGrid = {
        [DataGridKey]: dataGridState,
      };

      const selector1 = selectGridInstance('grid-1');
      const selector2 = selectGridInstance('grid-2');

      expect(selector1(state)).toEqual(gridState1);
      expect(selector2(state)).toEqual(gridState2);
      expect(selector1(state)).not.toEqual(selector2(state));
    });

    it('should create independent selector functions for different grid identifiers', () => {
      const selector1 = selectGridInstance('grid-1');
      const selector2 = selectGridInstance('grid-2');

      expect(selector1).not.toBe(selector2);
    });

    it('should work correctly when the data grid slice is missing from state', () => {
      const state = {} as RootStateWithDataGrid;

      const selector = selectGridInstance('my-grid');
      const result = selector(state);

      expect(result).toBeUndefined();
    });
  });

  describe('selectAllViews', () => {
    it('should retrieve all saved layouts for users to choose from', () => {
      const gridState1 = {} as GridState;
      const gridState2 = {} as GridState;

      const dataGridState: DataGridState = {
        instances: {},
        views: {
          'view-1': {
            id: 'view-1',
            name: 'Sales View',
            state: gridState1,
            createdAt: 1000000,
            updatedAt: 1000000,
          },
          'view-2': {
            id: 'view-2',
            name: 'Analytics View',
            state: gridState2,
            createdAt: 2000000,
            updatedAt: 2000000,
          },
        },
      };

      const state: RootStateWithDataGrid = {
        [DataGridKey]: dataGridState,
      };

      const result = selectAllViews(state);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Sales View');
      expect(result[1].name).toBe('Analytics View');
    });

    it('should return an empty list when no saved layouts exist', () => {
      const dataGridState: DataGridState = {
        instances: {},
        views: {},
      };

      const state: RootStateWithDataGrid = {
        [DataGridKey]: dataGridState,
      };

      const result = selectAllViews(state);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should convert saved layouts from storage format to a list for display', () => {
      const gridState = {} as GridState;

      const dataGridState: DataGridState = {
        instances: {},
        views: {
          'view-1': {
            id: 'view-1',
            name: 'Test View',
            state: gridState,
            createdAt: 1000000,
            updatedAt: 1000000,
          },
        },
      };

      const state: RootStateWithDataGrid = {
        [DataGridKey]: dataGridState,
      };

      const result = selectAllViews(state);

      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toEqual(dataGridState.views['view-1']);
    });

    it('should include all view properties for complete layout restoration', () => {
      const gridState = {} as GridState;

      const view = {
        id: 'view-1',
        name: 'Complete View',
        state: gridState,
        description: 'A test view',
        createdAt: 1000000,
        updatedAt: 2000000,
      };

      const dataGridState: DataGridState = {
        instances: {},
        views: {
          'view-1': view,
        },
      };

      const state: RootStateWithDataGrid = {
        [DataGridKey]: dataGridState,
      };

      const result = selectAllViews(state);

      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('state');
      expect(result[0]).toHaveProperty('description');
      expect(result[0]).toHaveProperty('createdAt');
      expect(result[0]).toHaveProperty('updatedAt');
    });

    it('should handle missing data grid slice gracefully', () => {
      const state = {} as RootStateWithDataGrid;

      const result = selectAllViews(state);

      expect(result).toEqual([]);
    });
  });

  describe('selectView', () => {
    it('should retrieve a specific saved layout by its unique identifier', () => {
      const gridState = {} as GridState;

      const view = {
        id: 'view-1',
        name: 'My View',
        state: gridState,
        createdAt: 1000000,
        updatedAt: 1000000,
      };

      const dataGridState: DataGridState = {
        instances: {},
        views: {
          'view-1': view,
        },
      };

      const state: RootStateWithDataGrid = {
        [DataGridKey]: dataGridState,
      };

      const selector = selectView('view-1');
      const result = selector(state);

      expect(result).toEqual(view);
    });

    it('should return nothing when requesting a layout that does not exist', () => {
      const dataGridState: DataGridState = {
        instances: {},
        views: {},
      };

      const state: RootStateWithDataGrid = {
        [DataGridKey]: dataGridState,
      };

      const selector = selectView('non-existent-view');
      const result = selector(state);

      expect(result).toBeUndefined();
    });

    it('should distinguish between different saved layouts', () => {
      const gridState1 = { id: 'state1' } as unknown as GridState;
      const gridState2 = { id: 'state2' } as unknown as GridState;

      const view1 = {
        id: 'view-1',
        name: 'View One',
        state: gridState1,
        createdAt: 1000000,
        updatedAt: 1000000,
      };

      const view2 = {
        id: 'view-2',
        name: 'View Two',
        state: gridState2,
        createdAt: 2000000,
        updatedAt: 2000000,
      };

      const dataGridState: DataGridState = {
        instances: {},
        views: {
          'view-1': view1,
          'view-2': view2,
        },
      };

      const state: RootStateWithDataGrid = {
        [DataGridKey]: dataGridState,
      };

      const selector1 = selectView('view-1');
      const selector2 = selectView('view-2');

      expect(selector1(state)).toEqual(view1);
      expect(selector2(state)).toEqual(view2);
      expect(selector1(state)).not.toEqual(selector2(state));
    });

    it('should create independent selector functions for different view identifiers', () => {
      const selector1 = selectView('view-1');
      const selector2 = selectView('view-2');

      expect(selector1).not.toBe(selector2);
    });

    it('should work correctly when the data grid slice is missing from state', () => {
      const state = {} as RootStateWithDataGrid;

      const selector = selectView('my-view');
      const result = selector(state);

      expect(result).toBeUndefined();
    });
  });

  describe('selectHasDataGridSlice', () => {
    it('should confirm when the data grid feature is available in the application', () => {
      const dataGridState: DataGridState = {
        instances: {},
        views: {},
      };

      const state: RootStateWithDataGrid = {
        [DataGridKey]: dataGridState,
      };

      const result = selectHasDataGridSlice(state);

      expect(result).toBe(true);
    });

    it('should indicate when the data grid feature has not been initialized', () => {
      const state = {} as RootStateWithDataGrid;

      const result = selectHasDataGridSlice(state);

      expect(result).toBe(false);
    });

    it('should help detect configuration issues when the grid is not working', () => {
      const stateWithoutDataGrid = {
        someOtherSlice: {},
      } as unknown as RootStateWithDataGrid;

      const result = selectHasDataGridSlice(stateWithoutDataGrid);

      expect(result).toBe(false);
    });

    it('should return a boolean value for simple conditional checks', () => {
      const state = {} as RootStateWithDataGrid;

      const result = selectHasDataGridSlice(state);

      expect(typeof result).toBe('boolean');
    });
  });

  describe('selector optimization', () => {
    it('should use memoization to avoid unnecessary recalculations', () => {
      // Test grid instance memoization
      const gridState = {} as GridState;
      const dataGridState: DataGridState = {
        instances: {
          'my-grid': gridState,
        },
        views: {},
      };

      const state: RootStateWithDataGrid = {
        [DataGridKey]: dataGridState,
      };

      const gridSelector = selectGridInstance('my-grid');
      const gridResult1 = gridSelector(state);
      const gridResult2 = gridSelector(state);

      expect(gridResult1).toBe(gridResult2);

      // Test views array memoization
      const viewsResult1 = selectAllViews(state);
      const viewsResult2 = selectAllViews(state);

      expect(viewsResult1).toBe(viewsResult2);
    });
  });

  describe('selector configuration and type safety', () => {
    it('should provide properly configured and type-safe selectors', () => {
      // Configuration
      expect(DataGridKey).toBe('dataGrid');

      // Exported selectors
      expect(typeof selectDataGridSlice).toBe('function');
      expect(typeof selectGridInstance).toBe('function');
      expect(typeof selectAllViews).toBe('function');
      expect(typeof selectView).toBe('function');
      expect(typeof selectHasDataGridSlice).toBe('function');

      // Factory functions for parameterized selectors
      const gridSelector = selectGridInstance('test-id');
      expect(typeof gridSelector).toBe('function');

      const viewSelector = selectView('test-view');
      expect(typeof viewSelector).toBe('function');
    });

    it('should work safely with various state configurations', () => {
      const dataGridState: DataGridState = {
        instances: {},
        views: {},
      };

      // Test with properly typed state
      const state: RootStateWithDataGrid = {
        [DataGridKey]: dataGridState,
      };

      expect(() => selectDataGridSlice(state)).not.toThrow();
      expect(() => selectAllViews(state)).not.toThrow();
      expect(() => selectHasDataGridSlice(state)).not.toThrow();

      // Test with additional unrelated slices
      const stateWithOtherSlices = {
        [DataGridKey]: dataGridState,
        otherSlice: { data: 'test' },
        anotherSlice: { value: 123 },
      } as RootStateWithDataGrid;

      const result = selectDataGridSlice(stateWithOtherSlices);
      expect(result).toEqual(dataGridState);
    });
  });
});
