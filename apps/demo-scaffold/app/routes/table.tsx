import { useMemo, useCallback } from 'react';
import { DataGrid } from '@open-kingdom/shared-frontend-ui-grid';
import type { GridColumn, GridApi, ColumnApi } from '@open-kingdom/shared-poly-util-types';

interface EmployeeRow {
  id: number;
  name: string;
  role: string;
  department: string;
  status: 'Active' | 'On Leave' | 'Remote';
  country: string;
}

const employeeRows: EmployeeRow[] = [
  { id: 1, name: 'Amelia Stone', role: 'Engineering Manager', department: 'Engineering', status: 'Active', country: 'USA' },
  { id: 2, name: 'Jared Collins', role: 'Product Designer', department: 'Product', status: 'Remote', country: 'Canada' },
  { id: 3, name: 'Priya Mehta', role: 'Data Analyst', department: 'Analytics', status: 'Active', country: 'India' },
  { id: 4, name: 'Luis Ortega', role: 'Sales Lead', department: 'Sales', status: 'On Leave', country: 'Spain' },
  { id: 5, name: 'Hana Suzuki', role: 'Customer Success', department: 'Customer Success', status: 'Active', country: 'Japan' },
];

const Table = () => {
  const columns = useMemo<GridColumn[]>(
    () => [
      { field: 'id', headerName: 'ID', width: 90, pinned: 'left' },
      { field: 'name', headerName: 'Name', flex: 1, minWidth: 180 },
      { field: 'role', headerName: 'Role', flex: 1, minWidth: 160 },
      { field: 'department', headerName: 'Department', flex: 1, minWidth: 140 },
      { field: 'status', headerName: 'Status', width: 140 },
      { field: 'country', headerName: 'Country', width: 140 },
    ],
    [],
  );

  const defaultColDef = useMemo<GridColumn>(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
    }),
    [],
  );

  const handleGridReady = useCallback((event: { api: GridApi; columnApi: ColumnApi }) => {
    event.api.sizeColumnsToFit();
    event.columnApi.autoSizeAllColumns();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '2.5rem' }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>Data Grid</h1>
        <p style={{ margin: 0, color: '#6b7280' }}>A concise example showcasing the Open Kingdom DataGrid wrapper.</p>
      </header>

      <div style={{ height: '420px' }}>
        <DataGrid
          options={{
            rowData: employeeRows,
            columnDefs: columns,
            defaultColDef,
            pagination: true,
            paginationPageSize: 5,
          }}
          events={{
            onGridReady: handleGridReady,
          }}
          style={{ height: '100%' }}
        />
      </div>
    </div>
  );
};

export default Table;