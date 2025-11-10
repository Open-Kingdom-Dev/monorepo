/**
 * Grid Types - Simplified wrapper around AG Grid types
 * Re-exports AG Grid types for convenience, allowing consumers to use grids
 * without importing AG Grid types directly, while maintaining direct compatibility.
 */

// Re-export AG Grid types directly - consumers can use these without importing ag-grid-community
export type {
  GridOptions,
  ColDef,
  ColGroupDef,
  GridApi,
  ColumnApi,
  ICellRendererParams,
  ValueGetterParams,
  ValueFormatterParams,
  ICellEditorParams,
  CellClassParams,
  CellClickedEvent,
  CellDoubleClickedEvent,
  CellContextMenuEvent,
  RowSelectedEvent,
  SelectionChangedEvent,
  GridReadyEvent,
  FirstDataRenderedEvent,
  IRowNode,
  FilterModel,
  SortModelItem,
  RefreshCellsParams,
  CsvExportParams,
  ExcelExportParams,
  RowClassParams,
  RowStyle,
  IsFullWidthRowParams,
} from 'ag-grid-community';

// Convenience type aliases for common use cases
import type { ColDef, ColGroupDef, ICellRendererParams, CellClassParams } from 'ag-grid-community';
export type GridColumn = ColDef;
export type GridColumnGroup = ColGroupDef;

// Type aliases for compatibility with existing code
export type CellRendererParams = ICellRendererParams;
export type CellStyleParams = CellClassParams;
