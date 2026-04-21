import { useMemo } from 'react';
import {
  DataTable,
  type ColumnDef,
} from '@open-kingdom/shared-frontend-ui-data-table';
import carsData from '../data/cars.json';

interface Car {
  make: string;
  model: string;
  price: number;
  electric: boolean;
}

const formatPrice = (value: number) =>
  value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

export const GridExample = () => {
  const columns = useMemo<ColumnDef<Car>[]>(
    () => [
      { id: 'make', accessorKey: 'make', header: 'Make' },
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
        header: 'Electric',
        cell: ({ row }) => (row.original.electric ? 'Yes' : 'No'),
        meta: { align: 'center' },
      },
    ],
    []
  );

  return (
    <DataTable<Car>
      data={carsData.data as Car[]}
      columns={columns}
      getRowId={(row) => `${row.make}-${row.model}`}
      enablePagination
      paginationPageSizes={[5, 10, 25]}
      persistStateKey="car-grid"
    />
  );
};
