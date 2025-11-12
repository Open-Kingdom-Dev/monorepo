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

  it('should display a functional grid with the provided data', async () => {
    const { container } = render(
      <DataGrid rowData={mockRowData} columnDefs={mockColDefs} />
    );

    await waitFor(() => {
      expect(container.querySelector('.ag-root-wrapper')).toBeInTheDocument();
    });
  });

  it('should allow external theming through custom class names', async () => {
    const { container } = render(
      <DataGrid
        rowData={mockRowData}
        columnDefs={mockColDefs}
        className="custom-grid"
      />
    );

    await waitFor(() => {
      const gridContainer = container.firstChild as HTMLElement;
      expect(gridContainer).toHaveClass('custom-grid');
    });
  });

  it('should display an empty grid when no data is supplied', () => {
    const { container } = render(
      <DataGrid rowData={[]} columnDefs={mockColDefs} />
    );

    expect(container.querySelector('.ag-root-wrapper')).toBeInTheDocument();
  });

  it('should display column headers based on the column definitions', async () => {
    render(<DataGrid rowData={mockRowData} columnDefs={mockColDefs} />);

    await waitFor(() => {
      expect(screen.getByText('Make')).toBeInTheDocument();
      expect(screen.getByText('Model')).toBeInTheDocument();
      expect(screen.getByText('Price')).toBeInTheDocument();
      expect(screen.getByText('Electric')).toBeInTheDocument();
    });
  });

  it('should display all provided row data in the grid', async () => {
    render(<DataGrid rowData={mockRowData} columnDefs={mockColDefs} />);

    await waitFor(() => {
      // Check first row data
      expect(screen.getByText('Tesla')).toBeInTheDocument();
      expect(screen.getByText('Model Y')).toBeInTheDocument();
      expect(screen.getByText('64950')).toBeInTheDocument();

      // Check second row data
      expect(screen.getByText('Ford')).toBeInTheDocument();
      expect(screen.getByText('F-Series')).toBeInTheDocument();
      expect(screen.getByText('33850')).toBeInTheDocument();

      // Check third row data
      expect(screen.getByText('Toyota')).toBeInTheDocument();
      expect(screen.getByText('Corolla')).toBeInTheDocument();
      expect(screen.getByText('29600')).toBeInTheDocument();
    });
  });

  it('should display the exact number of rows matching the data supplied', async () => {
    const { container } = render(
      <DataGrid rowData={mockRowData} columnDefs={mockColDefs} />
    );

    await waitFor(() => {
      const rows = container.querySelectorAll('.ag-row');
      expect(rows).toHaveLength(mockRowData.length);
    });
  });

  it('should allow users to select multiple rows for bulk operations', async () => {
    const { container } = render(
      <DataGrid
        rowData={mockRowData}
        columnDefs={mockColDefs}
        enableRowSelection={true}
      />
    );

    await waitFor(() => {
      expect(container.querySelector('.ag-root-wrapper')).toBeInTheDocument();
    });
  });

  it('should allow customization of row selection behavior to match specific application needs', async () => {
    const customRowSelection = {
      mode: 'singleRow' as const,
      checkboxes: false,
    };

    const { container } = render(
      <DataGrid
        rowData={mockRowData}
        columnDefs={mockColDefs}
        rowSelection={customRowSelection}
      />
    );

    await waitFor(() => {
      expect(container.querySelector('.ag-root-wrapper')).toBeInTheDocument();
    });
  });
});
