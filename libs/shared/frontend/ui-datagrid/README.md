# @open-kingdom/shared-frontend-ui-datagrid

React data grid component wrapping AG Grid Community Edition with opinionated defaults (sorting, filtering, pagination, auto-sizing), theme adaptation from the `ui-theme` color system (light/dark mode), optional grid state persistence to any async storage provider, and a Redux slice for multi-instance state and saved view management.

---

## Exports

### Component

| Export     | Type                                                        | Description              |
| ---------- | ----------------------------------------------------------- | ------------------------ |
| `DataGrid` | `ForwardRefExoticComponent<DataGridProps, GridApi \| null>` | Main data grid component |

### Redux Store (optional)

| Export                   | Type                                                                                      | Description                                                          |
| ------------------------ | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `dataGridSlice`          | `Slice<DataGridState>`                                                                    | Redux slice for multi-grid state and saved views, `name: 'dataGrid'` |
| `dataGridReducer`        | `Reducer<DataGridState>`                                                                  | Add to store under `DataGridKey`                                     |
| `DataGridKey`            | `'dataGrid'`                                                                              | Reducer path string constant                                         |
| `setGridState`           | `ActionCreator<{ id: string; gridState: GridState }>`                                     | Stores a grid instance's state by ID                                 |
| `saveView`               | `ActionCreator<{ id: string; name: string; gridState: GridState; description?: string }>` | Saves a named view                                                   |
| `deleteView`             | `ActionCreator<string>`                                                                   | Deletes a saved view by ID                                           |
| `clearGridState`         | `ActionCreator<string>`                                                                   | Removes a grid instance's state by ID                                |
| `selectDataGridSlice`    | `(state: RootStateWithDataGrid) => DataGridState`                                         | Selects full slice                                                   |
| `selectGridInstance(id)` | `(id: string) => (state) => GridState \| undefined`                                       | Selects a specific instance's state                                  |
| `selectAllViews`         | `(state) => DataGridView[]`                                                               | All saved views as array                                             |
| `selectView(id)`         | `(id: string) => (state) => DataGridView \| undefined`                                    | Selects a single saved view                                          |
| `selectHasDataGridSlice` | `(state) => boolean`                                                                      | True if slice is registered in store                                 |
| `RootStateWithDataGrid`  | `type`                                                                                    | `{ dataGrid: DataGridState }`                                        |

### Hooks

| Export                    | Type   | Description                                                                |
| ------------------------- | ------ | -------------------------------------------------------------------------- |
| `useGridStatePersistence` | `hook` | Internal hook for state persistence — consumed by `DataGrid` automatically |

### Theme

| Export                 | Type        | Description                                                       |
| ---------------------- | ----------- | ----------------------------------------------------------------- |
| `DataGridThemeAdapter` | `class`     | Converts a `UITheme` and `ThemeMode` into an AG Grid theme object |
| `ThemeMode`            | `type`      | `'light' \| 'dark'`                                               |
| `DataGridTheme`        | `type`      | `UITheme \| undefined`                                            |
| `UITheme`              | `interface` | Subset of `ui-theme` `Theme` that maps to AG Grid parameters      |

### Constants

| Export                      | Value               | Description                            |
| --------------------------- | ------------------- | -------------------------------------- |
| `DEFAULT_PAGE_SIZE`         | `20`                | Default pagination page size           |
| `DEFAULT_PAGE_SIZE_OPTIONS` | `[10, 20, 50, 100]` | Pagination page size selector options  |
| `DEFAULT_MIN_WIDTH`         | `100`               | Default column minimum width in pixels |
| `DEFAULT_TOOLTIP_DELAY`     | `500`               | Tooltip show delay in milliseconds     |
| `ROW_SELECTION_SINGLE`      | `'singleRow'`       | AG Grid row selection mode constant    |
| `ROW_SELECTION_MULTI`       | `'multiRow'`        | AG Grid row selection mode constant    |

### AG Grid Re-exports

All AG Grid Community exports are re-exported from `ag-grid-community`. This includes `ColDef`, `GridApi`, `GridState`, `GridReadyEvent`, `StateUpdatedEvent`, `ICellRendererParams`, `RowSelectionOptions`, `AllCommunityModule`, `ModuleRegistry`, and all other AG Grid Community types.

---

## Type Definitions

### `DataGridProps`

`DataGridProps` extends `AgGridReactProps` (excluding `theme`) with the following additional properties:

| Property                 | Type                         | Required | Default              | Description                                                 |
| ------------------------ | ---------------------------- | -------- | -------------------- | ----------------------------------------------------------- |
| `enableStatePersistence` | `boolean`                    | No       | `false`              | Enables grid state save/restore using `storageProvider`     |
| `storageProvider`        | `StorageProvider`            | No       | —                    | Required when `enableStatePersistence` is `true`            |
| `storageKey`             | `string`                     | No       | `'grid-state'`       | Key used when reading/writing state to the storage provider |
| `className`              | `string`                     | No       | —                    | CSS class applied to the grid container                     |
| `containerStyle`         | `CSSProperties`              | No       | `{ height: 'auto' }` | Inline styles for the grid container                        |
| `enableRowSelection`     | `boolean`                    | No       | `false`              | Enables multi-row selection with checkboxes                 |
| `mode`                   | `ThemeMode`                  | No       | —                    | Light or dark mode, passed to `DataGridThemeAdapter`        |
| `theme`                  | `DataGridTheme`              | No       | —                    | `UITheme` object from `ui-theme`; used to style the grid    |
| `onStateLoaded`          | `(state: GridState) => void` | No       | —                    | Called after persisted state is restored from storage       |
| `onStatePersisted`       | `(state: GridState) => void` | No       | —                    | Called after state is written to storage                    |

### `StorageProvider`

| Method   | Parameters                   | Returns                   | Description                   |
| -------- | ---------------------------- | ------------------------- | ----------------------------- |
| `get`    | `key: string`                | `Promise<string \| null>` | Reads a stored value by key   |
| `set`    | `key: string, value: string` | `Promise<void>`           | Writes a value by key         |
| `remove` | `key: string`                | `Promise<void>`           | Removes a stored value by key |

### `UITheme`

`UITheme` is a subset of the `ui-theme` `Theme` interface that maps to AG Grid visual parameters. It contains optional `colors` (with palettes for `primary`, `success`, `warning`, and `error`) and optional `typography` (with `fontFamily.sans` and `fontSize` scale entries).

### `DataGridView`

| Property      | Type        | Description                |
| ------------- | ----------- | -------------------------- |
| `id`          | `string`    | Unique view identifier     |
| `name`        | `string`    | Human-readable view name   |
| `state`       | `GridState` | The AG Grid state snapshot |
| `description` | `string`    | Optional description       |
| `createdAt`   | `number`    | Unix millisecond timestamp |
| `updatedAt`   | `number`    | Unix millisecond timestamp |

### `DataGridState`

| Property    | Type                           | Description                               |
| ----------- | ------------------------------ | ----------------------------------------- |
| `instances` | `Record<string, GridState>`    | Per-instance grid state, keyed by grid ID |
| `views`     | `Record<string, DataGridView>` | Saved named views, keyed by view ID       |

---

## Grid Defaults Applied

`DataGrid` spreads `gridDefaults` before all props:

| Setting                         | Default value                   |
| ------------------------------- | ------------------------------- |
| `defaultColDef.sortable`        | `true`                          |
| `defaultColDef.filter`          | `true`                          |
| `defaultColDef.resizable`       | `true`                          |
| `defaultColDef.floatingFilter`  | `true`                          |
| `defaultColDef.minWidth`        | `100`                           |
| `pagination`                    | `true`                          |
| `paginationPageSize`            | `20`                            |
| `paginationPageSizeSelector`    | `[10, 20, 50, 100]`             |
| `animateRows`                   | `true`                          |
| `enableCellTextSelection`       | `true`                          |
| `ensureDomOrder`                | `true`                          |
| `tooltipShowDelay`              | `500`                           |
| `suppressDragLeaveHidesColumns` | `true`                          |
| `domLayout`                     | `'autoHeight'`                  |
| `onFirstDataRendered`           | `params.api.sizeColumnsToFit()` |

---

## Usage Examples

### Basic usage

```tsx
import { DataGrid } from '@open-kingdom/shared-frontend-ui-datagrid';
import type { ColDef } from '@open-kingdom/shared-frontend-ui-datagrid';

interface Row {
  id: number;
  name: string;
  email: string;
}

const columnDefs: ColDef<Row>[] = [
  { field: 'name', headerName: 'Name', flex: 2 },
  { field: 'email', headerName: 'Email', flex: 3 },
];

function UserTable({ rows }: { rows: Row[] }) {
  return <DataGrid rowData={rows} columnDefs={columnDefs} />;
}
```

### With theme integration

```tsx
import { DataGrid } from '@open-kingdom/shared-frontend-ui-datagrid';
import { useTheme } from '@open-kingdom/shared-frontend-ui-theme';

function ThemedGrid({ rows, cols }) {
  const { theme, mode } = useTheme();

  return (
    <DataGrid
      rowData={rows}
      columnDefs={cols}
      theme={theme} // UITheme from ThemeProvider
      mode={mode} // 'light' | 'dark'
    />
  );
}
```

### With multi-row selection

```tsx
<DataGrid
  rowData={rows}
  columnDefs={cols}
  enableRowSelection={true}
  // Renders: checkboxes, header checkbox, selectAll: 'currentPage'
/>
```

### With GridRef (accessing AG Grid API)

```tsx
import { useRef } from 'react';
import { DataGrid } from '@open-kingdom/shared-frontend-ui-datagrid';
import type { GridApi } from '@open-kingdom/shared-frontend-ui-datagrid';

function SelectableGrid({ rows, cols }) {
  const gridRef = useRef<GridApi | null>(null);

  const getSelectedRows = () => {
    return gridRef.current?.getSelectedRows() ?? [];
  };

  return (
    <>
      <button onClick={() => console.log(getSelectedRows())}>Log Selected</button>
      <DataGrid ref={gridRef} rowData={rows} columnDefs={cols} enableRowSelection />
    </>
  );
}
```

### With state persistence

```tsx
import { DataGrid, type StorageProvider } from '@open-kingdom/shared-frontend-ui-datagrid';

// Implement StorageProvider backed by localStorage:
const localStorageProvider: StorageProvider = {
  get: async (key) => localStorage.getItem(key),
  set: async (key, value) => localStorage.setItem(key, value),
  remove: async (key) => localStorage.removeItem(key),
};

function PersistentGrid({ rows, cols }) {
  return <DataGrid rowData={rows} columnDefs={cols} enableStatePersistence storageProvider={localStorageProvider} storageKey="my-grid-v1" onStateLoaded={(state) => console.log('State loaded', state)} onStatePersisted={(state) => console.log('State saved', state)} />;
}
```

### Row selection modes

```tsx
// Default: single-row selection (click to select, no checkboxes)
<DataGrid rowData={rows} columnDefs={cols} />

// Multi-row: checkboxes, header checkbox, click-to-select disabled
<DataGrid rowData={rows} columnDefs={cols} enableRowSelection />

// Custom: full AG Grid rowSelection object overrides both defaults
<DataGrid
  rowData={rows}
  columnDefs={cols}
  rowSelection={{ mode: 'multiRow', checkboxes: false, enableSelectionWithoutKeys: true }}
/>
```

---

## Testing

```bash
nx test shared-frontend-ui-datagrid
```
