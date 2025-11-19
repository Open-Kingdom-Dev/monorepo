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
  describe('gridDefaults', () => {
    it('should apply default column configuration using defined constants', () => {
      expect(gridDefaults.defaultColDef.sortable).toBe(true);
      expect(gridDefaults.defaultColDef.filter).toBe(true);
      expect(gridDefaults.defaultColDef.resizable).toBe(true);
      expect(gridDefaults.defaultColDef.floatingFilter).toBe(true);
      expect(gridDefaults.defaultColDef.minWidth).toBe(DEFAULT_MIN_WIDTH);
    });

    it('should apply pagination configuration using defined constants', () => {
      expect(gridDefaults.pagination).toBe(true);
      expect(gridDefaults.paginationPageSize).toBe(DEFAULT_PAGE_SIZE);
      expect(gridDefaults.paginationPageSizeSelector).toBe(DEFAULT_PAGE_SIZE_OPTIONS);
    });

    it('should apply user experience configuration using defined constants', () => {
      expect(gridDefaults.animateRows).toBe(true);
      expect(gridDefaults.enableCellTextSelection).toBe(true);
      expect(gridDefaults.ensureDomOrder).toBe(true);
      expect(gridDefaults.tooltipShowDelay).toBe(DEFAULT_TOOLTIP_DELAY);
      expect(gridDefaults.suppressDragLeaveHidesColumns).toBe(true);
      expect(gridDefaults.domLayout).toBe(DOM_LAYOUT_AUTO_HEIGHT);
    });

    it('should call grid API to size columns when data first renders', () => {
      const mockSizeColumnsToFit = jest.fn();
      const mockParams: FirstDataRenderedEvent = {
        api: {
          sizeColumnsToFit: mockSizeColumnsToFit,
        } as unknown,
      } as FirstDataRenderedEvent;

      gridDefaults.onFirstDataRendered(mockParams);

      expect(mockSizeColumnsToFit).toHaveBeenCalledTimes(1);
    });

    it('should include custom loading overlay template with required elements', () => {
      expect(gridDefaults.overlayLoadingTemplate).toContain('ag-spinner');
      expect(gridDefaults.overlayLoadingTemplate).toContain('Loading data...');
      expect(gridDefaults.overlayLoadingTemplate).toContain('ag-custom-loading');
    });

    it('should include custom empty state overlay template with required elements', () => {
      expect(gridDefaults.overlayNoRowsTemplate).toContain('No data to display');
      expect(gridDefaults.overlayNoRowsTemplate).toContain('ag-custom-no-rows');
    });
  });

  describe('multiRowSelectionDefaults', () => {
    it('should configure multi-row selection mode using defined constant', () => {
      expect(multiRowSelectionDefaults.mode).toBe(ROW_SELECTION_MULTI);
    });

    it('should enable checkboxes without click selection', () => {
      expect(multiRowSelectionDefaults.checkboxes).toBe(true);
      expect(multiRowSelectionDefaults.enableClickSelection).toBe(false);
    });
  });

  describe('singleRowSelectionDefaults', () => {
    it('should configure single-row selection mode using defined constant', () => {
      expect(singleRowSelectionDefaults.mode).toBe(ROW_SELECTION_SINGLE);
    });

    it('should disable checkboxes and allow selection without modifier keys', () => {
      expect(singleRowSelectionDefaults.checkboxes).toBe(false);
      expect(singleRowSelectionDefaults.enableSelectionWithoutKeys).toBe(true);
      expect(singleRowSelectionDefaults.hideDisabledCheckboxes).toBe(true);
    });
  });

  describe('containerDefaults', () => {
    it('should set container height to auto', () => {
      expect(containerDefaults.height).toBe('auto');
    });
  });
});
