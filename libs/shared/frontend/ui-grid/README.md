# Shared UI Grid Library

This library provides a complete abstraction layer over AG Grid, allowing you to use powerful data grid functionality without directly importing AG Grid types or components.

## Features

- **Complete Abstraction**: All AG Grid functionality exposed through abstracted types and props
- **Type Safety**: Full TypeScript support with abstracted types
- **No AG Grid Imports**: Consumers never need to import AG Grid directly
- **Full Feature Support**: Sorting, filtering, pagination, selection, grouping, and more
- **Customizable**: Support for custom cell renderers, filters, and editors

## Installation

The library is already included in the monorepo. AG Grid dependencies are managed internally.

## Usage

### Basic Example

```tsx
import { DataGrid } from '@open-kingdom/shared-frontend-ui-grid';
import type { GridColumn } from '@open-kingdom/shared-poly-util-types';

const columns: GridColumn[] = [
  { field: 'id', headerName: 'ID', width: 100 },
  { field: 'name', headerName: 'Name', sortable: true, filterable: true },
  { field: 'email', headerName: 'Email', width: 200 },
];

const data = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
];

function MyComponent() {
  return (
    <DataGrid
      data={data}
      columns={columns}
      sortable={true}
      filterable={true}
      height="500px"
    />
  );
}
```

### With Pagination

```tsx
<DataGrid
  data={data}
  columns={columns}
  pagination={{ enabled: true, pageSize: 50 }}
/>
```

### With Row Selection

```tsx
<DataGrid
  data={data}
  columns={columns}
  rowSelection="multiple"
  onSelectionChanged={(selectedRows) => {
    console.log('Selected rows:', selectedRows);
  }}
/>
```

### Custom Cell Renderer

```tsx
import type { CellRendererParams } from '@open-kingdom/shared-poly-util-types';

const columns: GridColumn[] = [
  {
    field: 'status',
    headerName: 'Status',
    cellRenderer: (params: CellRendererParams) => {
      return params.value === 'active' ? (
        <span className="text-green-500">Active</span>
      ) : (
        <span className="text-red-500">Inactive</span>
      );
    },
  },
];
```

### With Callbacks

```tsx
<DataGrid
  data={data}
  columns={columns}
  onCellClicked={(params) => {
    console.log('Cell clicked:', params.value, params.data);
  }}
  onGridReady={({ api, columnApi }) => {
    console.log('Grid ready!');
    // Use api methods here
  }}
/>
```

## API Reference

### DataGrid Props

The `DataGrid` component accepts all properties from `GridConfig` (defined in `@open-kingdom/shared-poly-util-types`).

#### Required Props

- `data`: Array of data objects to display
- `columns`: Array of `GridColumn` definitions

#### Common Props

- `sortable`: Enable column sorting (default: `false`)
- `filterable`: Enable column filtering (default: `false`)
- `resizable`: Enable column resizing (default: `false`)
- `rowSelection`: Selection mode - `'single'` or `'multiple'`
- `pagination`: Pagination configuration object or `true`/`false`
- `height`: Grid height (string or number)
- `width`: Grid width (string or number)
- `theme`: Theme mode - `'light'`, `'dark'`, or `'auto'`

#### Callbacks

- `onRowSelected`: Called when a row is selected
- `onSelectionChanged`: Called when selection changes
- `onCellClicked`: Called when a cell is clicked
- `onCellDoubleClicked`: Called when a cell is double-clicked
- `onCellValueChanged`: Called when a cell value changes
- `onFilterChanged`: Called when filters change
- `onSortChanged`: Called when sorting changes
- `onGridReady`: Called when grid is ready
- `onFirstDataRendered`: Called when first data is rendered

### GridColumn

Column definition interface with support for:

- Field mapping: `field`, `headerName`
- Sizing: `width`, `minWidth`, `maxWidth`, `flex`
- Features: `sortable`, `filterable`, `resizable`, `pinned`
- Rendering: `cellRenderer`, `cellEditor`, `valueGetter`, `valueFormatter`
- Styling: `cellStyle`, `cellClass`, `headerClass`
- And many more...

See `GridColumn` type in `@open-kingdom/shared-poly-util-types` for complete API.

## Types

All types are exported from `@open-kingdom/shared-poly-util-types`:

- `GridColumn`: Column definition
- `GridConfig`: Grid configuration
- `GridFilter`: Filter definition
- `GridSort`: Sort definition
- `CellRendererParams`: Cell renderer parameters
- `ValueGetterParams`: Value getter parameters
- `ValueFormatterParams`: Value formatter parameters
- `CellStyleParams`: Cell style parameters
- `GridApi`: Grid API interface
- `ColumnApi`: Column API interface
- And more...

## Constants

Grid-related constants are available from `@open-kingdom/shared-poly-util-constants`:

- `DEFAULT_GRID_PAGE_SIZE`
- `DEFAULT_GRID_ROW_HEIGHT`
- `DEFAULT_GRID_HEADER_HEIGHT`
- `GRID_SELECTION_MODE_SINGLE`
- `GRID_SELECTION_MODE_MULTIPLE`
- And more...

## Important Notes

1. **Never import AG Grid directly**: Always use this library's components and types
2. **Type Safety**: Use types from `@open-kingdom/shared-poly-util-types`, not AG Grid types
3. **Internal Implementation**: The grid adapter maps our types to AG Grid internally
4. **Theme Support**: Basic theme support is included (full theme integration coming in Phase 3)

## Architecture

This library provides a complete abstraction layer:

- **Public API**: `DataGrid` component and types from `util-types`
- **Internal**: Grid adapter maps abstracted types to AG Grid types
- **Dependencies**: AG Grid is a dependency (not peer dependency) - consumers don't need to install it

## Examples

See the demo-scaffold application for usage examples.

## Future Enhancements

- Phase 2: Extended configuration and customization options
- Phase 3: Full theme integration with app theme system
- Phase 4: Redux Toolkit integration for state management

