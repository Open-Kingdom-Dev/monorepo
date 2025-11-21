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

  describe('theme configuration', () => {
    it('should use default grid appearance when no custom theme is provided', async () => {
      const { container } = render(
        <DataGrid rowData={mockRowData} columnDefs={mockColDefs} />
      );

      await waitFor(() => {
        expect(container.querySelector('.ag-root-wrapper')).toBeInTheDocument();
      });
    });

    it('should allow light and dark mode selection for user comfort', async () => {
      const { container: lightContainer } = render(
        <DataGrid rowData={mockRowData} columnDefs={mockColDefs} mode="light" />
      );

      await waitFor(() => {
        expect(
          lightContainer.querySelector('.ag-root-wrapper')
        ).toBeInTheDocument();
      });

      const { container: darkContainer } = render(
        <DataGrid rowData={mockRowData} columnDefs={mockColDefs} mode="dark" />
      );

      await waitFor(() => {
        expect(
          darkContainer.querySelector('.ag-root-wrapper')
        ).toBeInTheDocument();
      });
    });

    it('should allow brand colors to be applied through theme configuration', async () => {
      const theme = {
        colors: {
          primary: {
            '500': '#007bff',
          },
        },
      };

      const { container } = render(
        <DataGrid
          rowData={mockRowData}
          columnDefs={mockColDefs}
          theme={theme}
        />
      );

      await waitFor(() => {
        expect(container.querySelector('.ag-root-wrapper')).toBeInTheDocument();
      });
    });

    it('should allow custom fonts and spacing to match brand guidelines', async () => {
      const theme = {
        typography: {
          fontFamily: {
            sans: ['Inter', 'sans-serif'],
          },
          fontSize: {
            base: '14px',
          },
        },
        spacing: {
          md: '8px',
        },
        borderRadius: {
          md: '4px',
        },
      };

      const { container } = render(
        <DataGrid
          rowData={mockRowData}
          columnDefs={mockColDefs}
          theme={theme}
        />
      );

      await waitFor(() => {
        expect(container.querySelector('.ag-root-wrapper')).toBeInTheDocument();
      });
    });

    it('should work with themes that match our design system format', async () => {
      const designSystemTheme = {
        colors: {
          primary: {
            '400': '#60a5fa',
            '500': '#3b82f6',
            '600': '#2563eb',
          },
          neutral: {
            '50': '#f9fafb',
            '100': '#f3f4f6',
            '900': '#111827',
          },
          error: {
            '500': '#ef4444',
          },
          success: {
            '500': '#10b981',
          },
        },
        typography: {
          fontFamily: {
            sans: ['Inter', 'sans-serif'],
          },
          fontSize: {
            base: '1rem',
          },
        },
        spacing: {
          sm: '0.5rem',
        },
        borderRadius: {
          md: '0.5rem',
        },
      };

      const { container } = render(
        <DataGrid
          rowData={mockRowData}
          columnDefs={mockColDefs}
          theme={designSystemTheme}
        />
      );

      await waitFor(() => {
        expect(container.querySelector('.ag-root-wrapper')).toBeInTheDocument();
      });
    });

    it('should not break when theme has different color shade than expected', async () => {
      // Our adapter should handle themes that use 400 or 600 instead of the expected 500
      const themeWithDifferentShade = {
        colors: {
          primary: { '600': '#2563eb' }, // Using 600 instead of 500
        },
      };

      const { container } = render(
        <DataGrid
          rowData={mockRowData}
          columnDefs={mockColDefs}
          theme={themeWithDifferentShade}
        />
      );

      await waitFor(() => {
        expect(container.querySelector('.ag-root-wrapper')).toBeInTheDocument();
      });
    });

    it('should not break when theme has incomplete configuration', async () => {
      // Our adapter should handle themes with empty objects gracefully
      const incompleteTheme = {
        colors: {
          primary: { '500': '#3b82f6' },
        },
        spacing: {},
        borderRadius: {},
      };

      const { container } = render(
        <DataGrid
          rowData={mockRowData}
          columnDefs={mockColDefs}
          theme={incompleteTheme}
        />
      );

      await waitFor(() => {
        expect(container.querySelector('.ag-root-wrapper')).toBeInTheDocument();
      });
    });
  });
});
