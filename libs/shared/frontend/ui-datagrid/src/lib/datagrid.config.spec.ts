import { type FirstDataRenderedEvent } from 'ag-grid-community';
import {
  gridDefaults,
  multiRowSelectionDefaults,
  singleRowSelectionDefaults,
} from './datagrid.config';
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGE_SIZE_OPTIONS,
  DEFAULT_MIN_WIDTH,
  ROW_SELECTION_MULTI,
  ROW_SELECTION_SINGLE,
} from './datagrid.constants';

describe('datagrid.config', () => {
  describe('gridDefaults', () => {
    it('should provide sensible defaults for column behavior', () => {
      expect(gridDefaults.defaultColDef).toEqual({
        sortable: true,
        filter: true,
        resizable: true,
        floatingFilter: true,
        minWidth: DEFAULT_MIN_WIDTH,
      });
    });

    it('should configure pagination with appropriate defaults', () => {
      expect(gridDefaults.pagination).toBe(true);
      expect(gridDefaults.paginationPageSize).toBe(DEFAULT_PAGE_SIZE);
      expect(gridDefaults.paginationPageSizeSelector).toBe(DEFAULT_PAGE_SIZE_OPTIONS);
    });

    it('should auto-size columns when data first renders', () => {
      const mockSizeColumnsToFit = jest.fn();
      const mockParams: FirstDataRenderedEvent = {
        api: {
          sizeColumnsToFit: mockSizeColumnsToFit,
        } as unknown,
      } as FirstDataRenderedEvent;

      gridDefaults.onFirstDataRendered(mockParams);
      expect(mockSizeColumnsToFit).toHaveBeenCalled();
    });
  });

  describe('row selection configurations', () => {
    it('should provide appropriate multi-row selection defaults', () => {
      expect(multiRowSelectionDefaults).toEqual({
        mode: ROW_SELECTION_MULTI,
        checkboxes: true,
        headerCheckbox: true,
        selectAll: 'currentPage',
        enableClickSelection: false,
      });
    });

    it('should provide appropriate single-row selection defaults', () => {
      expect(singleRowSelectionDefaults).toEqual({
        mode: ROW_SELECTION_SINGLE,
        checkboxes: false,
        enableSelectionWithoutKeys: true,
        hideDisabledCheckboxes: true,
      });
    });
  });
});
