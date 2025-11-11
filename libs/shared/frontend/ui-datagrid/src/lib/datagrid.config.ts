import { type FirstDataRenderedEvent } from "ag-grid-community";
import {
  DEFAULT_GRID_PAGE_SIZE,
  DEFAULT_GRID_PAGE_SIZE_OPTIONS,
  DEFAULT_COLUMN_MIN_WIDTH,
  DEFAULT_TOOLTIP_SHOW_DELAY,
  DEFAULT_CHECKBOX_COLUMN_WIDTH,
  GRID_SELECTION_MODE_MULTIPLE,
  GRID_PIN_LEFT,
  GRID_DOM_LAYOUT,
} from "./datagrid.constants";

export const gridDefaults = {
  // Column defaults
  defaultColDef: {
    sortable: true,
    filter: true,
    resizable: true,
    floatingFilter: true,
    minWidth: DEFAULT_COLUMN_MIN_WIDTH,
  },

  // Pagination
  pagination: true,
  paginationPageSize: DEFAULT_GRID_PAGE_SIZE,
  paginationPageSizeSelector: DEFAULT_GRID_PAGE_SIZE_OPTIONS,

  // Row selection
  rowSelection: GRID_SELECTION_MODE_MULTIPLE,
  suppressRowClickSelection: true,

  // UX
  animateRows: true,
  enableCellTextSelection: true,
  ensureDomOrder: true,
  tooltipShowDelay: DEFAULT_TOOLTIP_SHOW_DELAY,
  suppressDragLeaveHidesColumns: true,
  domLayout: GRID_DOM_LAYOUT,

  // Auto-size
  onFirstDataRendered: (params: FirstDataRenderedEvent) => params.api.sizeColumnsToFit(),

  // Loading states
  overlayLoadingTemplate: '<span>Loading data...</span>',
  overlayNoRowsTemplate: '<span>No data to display</span>',
};

export const checkboxColumn = {
  headerCheckboxSelection: true,
  checkboxSelection: true,
  width: DEFAULT_CHECKBOX_COLUMN_WIDTH,
  maxWidth: DEFAULT_CHECKBOX_COLUMN_WIDTH,
  suppressMenu: true,
  suppressMovable: true,
  lockPosition: GRID_PIN_LEFT,
};

export const containerDefaults = {
  height: 'auto',
}
