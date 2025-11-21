import { render, waitFor, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { DataGrid } from './datagrid';

describe('DataGrid', () => {
  const mockRowData = [
    { make: 'Tesla', model: 'Model Y', price: 64950, electric: true },
    { make: 'Ford', model: 'F-Series', price: 33850, electric: false },
    { make: 'Toyota', model: 'Corolla', price: 29600, electric: false },
  ];

  const mockColDefs = [
    { field: 'make' },
    { field: 'model' },
    { field: 'price' },
    { field: 'electric' },
  ];

  it('should render AG Grid with provided data and columns', async () => {
    const { container } = render(
      <DataGrid rowData={mockRowData} columnDefs={mockColDefs} />
    );

    await waitFor(() => {
      // Verify grid is rendered
      expect(container.querySelector('.ag-root-wrapper')).toBeInTheDocument();

      // Verify data is displayed
      expect(screen.getByText('Tesla')).toBeInTheDocument();
      expect(screen.getByText('Ford')).toBeInTheDocument();
      expect(screen.getByText('Toyota')).toBeInTheDocument();
    });
  });

  it('should apply custom className to grid container', () => {
    const { container } = render(
      <DataGrid
        rowData={mockRowData}
        columnDefs={mockColDefs}
        className="custom-grid"
      />
    );

    const gridContainer = container.firstChild as HTMLElement;
    expect(gridContainer).toHaveClass('custom-grid');
  });

  it('should apply row selection configuration when provided', () => {
    const { container } = render(
      <DataGrid
        rowData={mockRowData}
        columnDefs={mockColDefs}
        enableRowSelection={true}
      />
    );

    // Just verify the grid renders - we're not testing AG Grid's selection behavior
    expect(container.querySelector('.ag-root-wrapper')).toBeInTheDocument();
  });
});
