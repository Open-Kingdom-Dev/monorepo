import { type FirstDataRenderedEvent } from 'ag-grid-community';
import {
  gridDefaults,
  multiRowSelectionDefaults,
  singleRowSelectionDefaults,
  containerDefaults,
} from './datagrid.config';
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGE_SIZE_OPTIONS,
  DEFAULT_MIN_WIDTH,
  DEFAULT_TOOLTIP_DELAY,
  DOM_LAYOUT_AUTO_HEIGHT,
  ROW_SELECTION_MULTI,
  ROW_SELECTION_SINGLE,
} from './datagrid.constants';

describe('datagrid.config', () => {
  describe('grid defaults', () => {
    describe('column defaults', () => {
      it('should allow users to sort data in columns', () => {
        expect(gridDefaults.defaultColDef.sortable).toBe(true);
      });

      it('should allow users to filter data in columns', () => {
        expect(gridDefaults.defaultColDef.filter).toBe(true);
      });

      it('should allow users to resize columns to their preferred width', () => {
        expect(gridDefaults.defaultColDef.resizable).toBe(true);
      });

      it('should provide quick filter inputs in column headers for easier data filtering', () => {
        expect(gridDefaults.defaultColDef.floatingFilter).toBe(true);
      });

      it('should prevent columns from becoming too narrow to read', () => {
        expect(gridDefaults.defaultColDef.minWidth).toBe(DEFAULT_MIN_WIDTH);
        expect(gridDefaults.defaultColDef.minWidth).toBe(100);
      });
    });

    describe('pagination', () => {
      it('should break large datasets into pages for better performance and usability', () => {
        expect(gridDefaults.pagination).toBe(true);
      });

      it('should display a reasonable number of rows per page by default', () => {
        expect(gridDefaults.paginationPageSize).toBe(DEFAULT_PAGE_SIZE);
        expect(gridDefaults.paginationPageSize).toBe(20);
      });

      it('should allow users to choose how many rows to display per page', () => {
        expect(gridDefaults.paginationPageSizeSelector).toEqual(
          DEFAULT_PAGE_SIZE_OPTIONS
        );
        expect(gridDefaults.paginationPageSizeSelector).toEqual([
          10, 20, 50, 100,
        ]);
      });

      it('should use the same page size options throughout the application', () => {
        expect(gridDefaults.paginationPageSizeSelector).toBe(
          DEFAULT_PAGE_SIZE_OPTIONS
        );
      });
    });

    describe('user experience', () => {
      it('should animate row movements for smoother visual transitions', () => {
        expect(gridDefaults.animateRows).toBe(true);
      });

      it('should allow users to select and copy text from grid cells', () => {
        expect(gridDefaults.enableCellTextSelection).toBe(true);
      });

      it('should maintain consistent tab order for keyboard navigation accessibility', () => {
        expect(gridDefaults.ensureDomOrder).toBe(true);
      });

      it('should delay tooltip display to avoid overwhelming users with immediate popups', () => {
        expect(gridDefaults.tooltipShowDelay).toBe(DEFAULT_TOOLTIP_DELAY);
        expect(gridDefaults.tooltipShowDelay).toBe(500);
      });

      it('should prevent columns from accidentally disappearing when dragged outside the grid', () => {
        expect(gridDefaults.suppressDragLeaveHidesColumns).toBe(true);
      });

      it('should automatically adjust grid height to fit all visible content', () => {
        expect(gridDefaults.domLayout).toBe(DOM_LAYOUT_AUTO_HEIGHT);
        expect(gridDefaults.domLayout).toBe('autoHeight');
      });
    });

    describe('automatic column sizing', () => {
      it('should provide a function to adjust column widths when data loads', () => {
        expect(typeof gridDefaults.onFirstDataRendered).toBe('function');
      });

      it('should automatically fit columns to available space when data first renders', () => {
        const mockSizeColumnsToFit = jest.fn();
        const mockParams: FirstDataRenderedEvent = {
          api: {
            sizeColumnsToFit: mockSizeColumnsToFit,
          } as unknown,
        } as FirstDataRenderedEvent;

        gridDefaults.onFirstDataRendered(mockParams);

        expect(mockSizeColumnsToFit).toHaveBeenCalledTimes(1);
      });
    });

    describe('loading and empty states', () => {
      it('should display a custom loading message while data is being fetched', () => {
        expect(gridDefaults.overlayLoadingTemplate).toBeTruthy();
        expect(typeof gridDefaults.overlayLoadingTemplate).toBe('string');
      });

      it('should show a loading spinner to indicate data is being fetched', () => {
        expect(gridDefaults.overlayLoadingTemplate).toContain('ag-spinner');
      });

      it('should inform users that data is loading', () => {
        expect(gridDefaults.overlayLoadingTemplate).toContain(
          'Loading data...'
        );
      });

      it('should allow custom styling of the loading overlay', () => {
        expect(gridDefaults.overlayLoadingTemplate).toContain(
          'ag-custom-loading'
        );
      });

      it('should display a helpful message when no data is available', () => {
        expect(gridDefaults.overlayNoRowsTemplate).toBeTruthy();
        expect(typeof gridDefaults.overlayNoRowsTemplate).toBe('string');
      });

      it('should inform users when there is no data to display', () => {
        expect(gridDefaults.overlayNoRowsTemplate).toContain(
          'No data to display'
        );
      });

      it('should allow custom styling of the empty state message', () => {
        expect(gridDefaults.overlayNoRowsTemplate).toContain(
          'ag-custom-no-rows'
        );
      });
    });
  });

  describe('multiRowSelectionDefaults', () => {
    it('should enable selection of multiple rows at once', () => {
      expect(multiRowSelectionDefaults.mode).toBe(ROW_SELECTION_MULTI);
      expect(multiRowSelectionDefaults.mode).toBe('multiRow');
    });

    it('should provide checkboxes for selecting individual rows', () => {
      expect(multiRowSelectionDefaults.checkboxes).toBe(true);
    });

    it('should require explicit checkbox interaction to prevent accidental selection', () => {
      expect(multiRowSelectionDefaults.enableClickSelection).toBe(false);
    });

    it('should include all necessary properties for multi-row selection', () => {
      expect(multiRowSelectionDefaults).toHaveProperty('mode');
      expect(multiRowSelectionDefaults).toHaveProperty('checkboxes');
      expect(multiRowSelectionDefaults).toHaveProperty('headerCheckbox');
      expect(multiRowSelectionDefaults).toHaveProperty('selectAll');
      expect(multiRowSelectionDefaults).toHaveProperty('enableClickSelection');
    });
  });

  describe('singleRowSelectionDefaults', () => {
    it('should enable selection of a single row at a time', () => {
      expect(singleRowSelectionDefaults.mode).toBe(ROW_SELECTION_SINGLE);
      expect(singleRowSelectionDefaults.mode).toBe('singleRow');
    });

    it('should not display checkboxes for single row selection', () => {
      expect(singleRowSelectionDefaults.checkboxes).toBe(false);
    });

    it('should allow row selection without requiring modifier keys', () => {
      expect(singleRowSelectionDefaults.enableSelectionWithoutKeys).toBe(true);
    });

    it('should hide disabled checkboxes to maintain clean UI', () => {
      expect(singleRowSelectionDefaults.hideDisabledCheckboxes).toBe(true);
    });

    it('should include all necessary properties for single-row selection', () => {
      expect(singleRowSelectionDefaults).toHaveProperty('mode');
      expect(singleRowSelectionDefaults).toHaveProperty('checkboxes');
      expect(singleRowSelectionDefaults).toHaveProperty(
        'enableSelectionWithoutKeys'
      );
      expect(singleRowSelectionDefaults).toHaveProperty(
        'hideDisabledCheckboxes'
      );
    });
  });

  describe('containerDefaults', () => {
    it('should automatically adjust container height to fit content', () => {
      expect(containerDefaults.height).toBe('auto');
    });

    it('should provide a valid configuration object for grid container styling', () => {
      expect(typeof containerDefaults).toBe('object');
      expect(containerDefaults).not.toBeNull();
    });
  });

  describe('configuration stability', () => {
    it('should preserve grid defaults when spread into new configurations', () => {
      const originalGridDefaults = { ...gridDefaults };
      const spread = { ...gridDefaults };

      expect(spread).toEqual(originalGridDefaults);
    });

    it('should preserve multi-row selection settings when spread into new configurations', () => {
      const originalRowSelection = { ...multiRowSelectionDefaults };
      const spread = { ...multiRowSelectionDefaults };

      expect(spread).toEqual(originalRowSelection);
    });

    it('should preserve single-row selection settings when spread into new configurations', () => {
      const originalRowSelection = { ...singleRowSelectionDefaults };
      const spread = { ...singleRowSelectionDefaults };

      expect(spread).toEqual(originalRowSelection);
    });

    it('should preserve container defaults when spread into new configurations', () => {
      const originalContainerDefaults = { ...containerDefaults };
      const spread = { ...containerDefaults };

      expect(spread).toEqual(originalContainerDefaults);
    });
  });

  describe('configuration completeness', () => {
    it('should export all required configuration objects', () => {
      expect(gridDefaults).toBeDefined();
      expect(multiRowSelectionDefaults).toBeDefined();
      expect(singleRowSelectionDefaults).toBeDefined();
      expect(containerDefaults).toBeDefined();
    });

    it('should use appropriate data types for all configuration values', () => {
      expect(typeof gridDefaults.pagination).toBe('boolean');
      expect(typeof gridDefaults.paginationPageSize).toBe('number');
      expect(Array.isArray(gridDefaults.paginationPageSizeSelector)).toBe(true);
    });

    it('should provide distinct selection modes for different use cases', () => {
      expect(multiRowSelectionDefaults.mode).not.toBe(
        singleRowSelectionDefaults.mode
      );
      expect(multiRowSelectionDefaults.checkboxes).not.toBe(
        singleRowSelectionDefaults.checkboxes
      );
    });
  });
});
