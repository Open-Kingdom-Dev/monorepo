import {
  RowSelectionOptions,
  type FirstDataRenderedEvent,
} from './datagrid.types';
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGE_SIZE_OPTIONS,
  DEFAULT_MIN_WIDTH,
  DEFAULT_TOOLTIP_DELAY,
  DOM_LAYOUT_AUTO_HEIGHT,
  ROW_SELECTION_MULTI,
  ROW_SELECTION_SINGLE,
} from './datagrid.constants';

export const gridDefaults = {
  // Column defaults
  defaultColDef: {
    sortable: true,
    filter: true,
    resizable: true,
    floatingFilter: true,
    minWidth: DEFAULT_MIN_WIDTH,
  },

  // Pagination
  pagination: true,
  paginationPageSize: DEFAULT_PAGE_SIZE,
  paginationPageSizeSelector: DEFAULT_PAGE_SIZE_OPTIONS,

  // UX
  animateRows: true,
  enableCellTextSelection: true,
  ensureDomOrder: true,
  tooltipShowDelay: DEFAULT_TOOLTIP_DELAY,
  suppressDragLeaveHidesColumns: true,
  domLayout: DOM_LAYOUT_AUTO_HEIGHT,

  // Auto-size
  onFirstDataRendered: (params: FirstDataRenderedEvent) =>
    params.api.sizeColumnsToFit(),

  // Loading states
  overlayLoadingTemplate: `
    <div class="ag-custom-loading">
      <div class="ag-spinner"></div>
      <span>Loading data...</span>
    </div>
  `,

  overlayNoRowsTemplate: `
    <div class="ag-custom-no-rows">
      <span>No data to display</span>
    </div>
  `,
};

export const multiRowSelectionDefaults: RowSelectionOptions = {
  mode: ROW_SELECTION_MULTI,
  checkboxes: true,
  headerCheckbox: true,
  selectAll: 'currentPage',
  enableClickSelection: false,
};

export const singleRowSelectionDefaults: RowSelectionOptions = {
  mode: ROW_SELECTION_SINGLE,
  checkboxes: false,
  enableSelectionWithoutKeys: true,
  hideDisabledCheckboxes: true,
};

export const containerDefaults = {
  height: 'auto',
};
