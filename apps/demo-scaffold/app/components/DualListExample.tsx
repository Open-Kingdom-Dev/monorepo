import { useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import {
  DualListTable,
  type ColumnDef,
  type Row,
} from '@open-kingdom/shared-frontend-ui-data-table';
import { Badge, Button } from '@open-kingdom/shared-frontend-ui-primitives';

type CarType = 'Sedan' | 'SUV' | 'Compact' | 'Truck';
type RentalTerm = 'Day pass' | 'Week pass' | 'Month pass';

interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  type: CarType;
  electric: boolean;
  dayRate: number;
}

interface Reservation extends Car {
  term: RentalTerm;
}

const TERM_DAYS: Record<RentalTerm, number> = {
  'Day pass': 1,
  'Week pass': 7,
  'Month pass': 30,
};

const SEED_CARS: Car[] = [
  {
    id: 'tesla-model-y',
    make: 'Tesla',
    model: 'Model Y',
    year: 2024,
    type: 'SUV',
    electric: true,
    dayRate: 119,
  },
  {
    id: 'ford-f-series',
    make: 'Ford',
    model: 'F-Series',
    year: 2023,
    type: 'Truck',
    electric: false,
    dayRate: 89,
  },
  {
    id: 'toyota-corolla',
    make: 'Toyota',
    model: 'Corolla',
    year: 2024,
    type: 'Sedan',
    electric: false,
    dayRate: 49,
  },
  {
    id: 'mercedes-eqa',
    make: 'Mercedes',
    model: 'EQA',
    year: 2024,
    type: 'SUV',
    electric: true,
    dayRate: 139,
  },
  {
    id: 'fiat-500',
    make: 'Fiat',
    model: '500',
    year: 2022,
    type: 'Compact',
    electric: false,
    dayRate: 39,
  },
  {
    id: 'nissan-juke',
    make: 'Nissan',
    model: 'Juke',
    year: 2023,
    type: 'SUV',
    electric: false,
    dayRate: 65,
  },
];

const formatPrice = (value: number) =>
  value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

const TYPE_VARIANT: Record<CarType, 'secondary' | 'muted' | 'outline'> = {
  SUV: 'secondary',
  Sedan: 'outline',
  Compact: 'muted',
  Truck: 'outline',
};

const TERM_VARIANT: Record<RentalTerm, 'default' | 'success' | 'warning'> = {
  'Day pass': 'default',
  'Week pass': 'success',
  'Month pass': 'warning',
};

const stripTerm = (reservation: Reservation): Car => {
  const car: Car = {
    id: reservation.id,
    make: reservation.make,
    model: reservation.model,
    year: reservation.year,
    type: reservation.type,
    electric: reservation.electric,
    dayRate: reservation.dayRate,
  };
  return car;
};

function transferRows<S extends { id: string }, T extends { id: string }>(
  rows: Row<S>[],
  from: Dispatch<SetStateAction<S[]>>,
  to: Dispatch<SetStateAction<T[]>>,
  transform: (source: S) => T
) {
  const moving = rows.map((row) => transform(row.original));
  const sourceIds = new Set(rows.map((row) => row.original.id));
  from((prev) => prev.filter((item) => !sourceIds.has(item.id)));
  to((prev) => [...prev, ...moving]);
}

export const DualListExample = () => {
  const [available, setAvailable] = useState<Car[]>(() =>
    SEED_CARS.slice(0, 4)
  );
  const [reserved, setReserved] = useState<Reservation[]>(() =>
    SEED_CARS.slice(4).map((car) => ({ ...car, term: 'Day pass' }))
  );

  const reserveCars = (rows: Row<Car>[], term: RentalTerm) =>
    transferRows(rows, setAvailable, setReserved, (car) => ({ ...car, term }));

  const returnCars = (rows: Row<Reservation>[]) =>
    transferRows(rows, setReserved, setAvailable, stripTerm);

  const availableColumns = useMemo<ColumnDef<Car>[]>(
    () => [
      { id: 'make', accessorKey: 'make', header: 'Make' },
      { id: 'model', accessorKey: 'model', header: 'Model' },
      {
        id: 'year',
        accessorKey: 'year',
        header: 'Year',
        meta: { align: 'right' },
      },
      {
        id: 'type',
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => (
          <Badge variant={TYPE_VARIANT[row.original.type]}>
            {row.original.type}
          </Badge>
        ),
      },
      {
        id: 'powertrain',
        accessorKey: 'electric',
        header: 'Powertrain',
        cell: ({ row }) => (
          <Badge variant={row.original.electric ? 'success' : 'secondary'}>
            {row.original.electric ? 'Electric' : 'Gas'}
          </Badge>
        ),
      },
      {
        id: 'dayRate',
        accessorKey: 'dayRate',
        header: 'Day rate',
        cell: ({ row }) => formatPrice(row.original.dayRate),
        meta: { align: 'right' },
      },
    ],
    []
  );

  const reservedColumns = useMemo<ColumnDef<Reservation>[]>(
    () => [
      { id: 'make', accessorKey: 'make', header: 'Make' },
      { id: 'model', accessorKey: 'model', header: 'Model' },
      {
        id: 'year',
        accessorKey: 'year',
        header: 'Year',
        meta: { align: 'right' },
      },
      {
        id: 'type',
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => (
          <Badge variant={TYPE_VARIANT[row.original.type]}>
            {row.original.type}
          </Badge>
        ),
      },
      {
        id: 'term',
        accessorKey: 'term',
        header: 'Reserved for',
        cell: ({ row }) => (
          <Badge variant={TERM_VARIANT[row.original.term]}>
            {row.original.term}
          </Badge>
        ),
      },
      {
        id: 'total',
        header: 'Total',
        cell: ({ row }) =>
          formatPrice(row.original.dayRate * TERM_DAYS[row.original.term]),
        meta: { align: 'right' },
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button size="sm" variant="ghost" onClick={() => returnCars([row])}>
              Return
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <DualListTable<Car, Reservation>
      primary={{
        label: `Available fleet (${available.length})`,
        data: available,
        columns: availableColumns,
        getRowId: (row) => row.id,
        emptyState: {
          title: 'Every car is out',
          description: 'Return a reservation below to make a car available.',
        },
        bulkActions: ({ selectedRows, clearSelection }) => (
          <>
            <Button
              size="sm"
              onClick={() => {
                reserveCars(selectedRows, 'Day pass');
                clearSelection();
              }}
            >
              Reserve {selectedRows.length} for a day
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                reserveCars(selectedRows, 'Week pass');
                clearSelection();
              }}
            >
              Reserve for a week
            </Button>
            <Button size="sm" variant="ghost" onClick={clearSelection}>
              Clear
            </Button>
          </>
        ),
      }}
      secondary={{
        label: `Reservations (${reserved.length})`,
        data: reserved,
        columns: reservedColumns,
        getRowId: (row) => row.id,
        emptyState: {
          title: 'No active reservations',
          description: 'Select a car above and reserve it for a day or a week.',
        },
        bulkActions: ({ selectedRows, clearSelection }) => (
          <>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                returnCars(selectedRows);
                clearSelection();
              }}
            >
              Return {selectedRows.length}
            </Button>
            <Button size="sm" variant="ghost" onClick={clearSelection}>
              Clear
            </Button>
          </>
        ),
      }}
    />
  );
};
