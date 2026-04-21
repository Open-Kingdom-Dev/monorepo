import { useMemo } from 'react';
import {
  DataTable,
  type ColumnDef,
} from '@open-kingdom/shared-frontend-ui-data-table';
import { Badge, Button } from '@open-kingdom/shared-frontend-ui-primitives';
import carsData from '../data/cars.json';

interface Car {
  make: string;
  model: string;
  price: number;
  electric: boolean;
}

const formatPrice = (value: number) =>
  value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

export const AdvancedGridExample = () => {
  const columns = useMemo<ColumnDef<Car>[]>(
    () => [
      {
        id: 'make',
        accessorKey: 'make',
        header: 'Make',
        meta: { tooltip: (row) => `${row.make} ${row.model}` },
      },
      { id: 'model', accessorKey: 'model', header: 'Model' },
      {
        id: 'price',
        accessorKey: 'price',
        header: 'Price',
        cell: ({ row }) => formatPrice(row.original.price),
        meta: { align: 'right' },
      },
      {
        id: 'electric',
        accessorKey: 'electric',
        header: 'Powertrain',
        cell: ({ row }) => (
          <Badge variant={row.original.electric ? 'success' : 'secondary'}>
            {row.original.electric ? 'Electric' : 'Gas'}
          </Badge>
        ),
        meta: { align: 'center', enableFloatingFilter: false },
        filterFn: (row, _columnId, filterValue) =>
          String(row.original.electric) === String(filterValue),
      },
    ],
    []
  );

  return (
    <DataTable<Car>
      data={carsData.data as Car[]}
      columns={columns}
      getRowId={(row) => `${row.make}-${row.model}`}
      enableRowSelection
      enableGlobalFilter
      globalFilterPlaceholder="Search cars"
      enableFloatingFilters
      enableColumnVisibility
      enablePagination
      paginationPageSizes={[5, 10, 25]}
      initialColumnPinning={{ left: ['make'] }}
      persistStateKey="advanced-car-grid"
      toolbarActions={(table) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            table.resetColumnFilters();
            table.setGlobalFilter('');
          }}
        >
          Reset filters
        </Button>
      )}
      bulkActions={({ selectedRows, clearSelection }) => (
        <>
          <Button
            size="sm"
            onClick={() => {
              const total = selectedRows.reduce(
                (sum, row) => sum + row.original.price,
                0
              );
              alert(`Total: ${formatPrice(total)}`);
            }}
          >
            Sum {selectedRows.length} cars
          </Button>
          <Button variant="ghost" size="sm" onClick={clearSelection}>
            Clear
          </Button>
        </>
      )}
      emptyState={{
        title: 'No cars to show',
        description: 'Adjust your filters or add a new car to the catalogue.',
      }}
    />
  );
};
