import { type FirstDataRenderedEvent, RowSelectionOptions } from "ag-grid-community";
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGE_SIZE_OPTIONS,
  DEFAULT_MIN_WIDTH,
  DEFAULT_TOOLTIP_DELAY,
  DOM_LAYOUT_AUTO_HEIGHT,
  ROW_SELECTION_MULTI,
} from "./datagrid.constants";

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

  // Row selection
  suppressRowClickSelection: true,

  // UX
  animateRows: true,
  enableCellTextSelection: true,
  ensureDomOrder: true,
  tooltipShowDelay: DEFAULT_TOOLTIP_DELAY,
  suppressDragLeaveHidesColumns: true,
  domLayout: DOM_LAYOUT_AUTO_HEIGHT,

  // Auto-size
  onFirstDataRendered: (params: FirstDataRenderedEvent) => params.api.sizeColumnsToFit(),

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

export const rowSelectionColumn: RowSelectionOptions = {
  mode: ROW_SELECTION_MULTI,
  checkboxes: true,
  headerCheckbox: true,
  selectAll: 'currentPage',
  enableClickSelection: false,
}

export const containerDefaults = {
  height: 'auto',
}
