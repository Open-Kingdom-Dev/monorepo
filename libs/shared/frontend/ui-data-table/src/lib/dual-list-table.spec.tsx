import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ColumnDef, Row } from '@tanstack/react-table';
import { DualListTable } from './dual-list-table';

interface Item {
  id: string;
  label: string;
}

const AVAILABLE: Item[] = [
  { id: 'a1', label: 'Apple' },
  { id: 'a2', label: 'Banana' },
];

const RESERVED: Item[] = [
  { id: 'r1', label: 'Cherry' },
  { id: 'r2', label: 'Date' },
];

const COLUMNS: ColumnDef<Item>[] = [
  { id: 'label', accessorKey: 'label', header: 'Label' },
];

beforeEach(() => {
  globalThis.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

function bulkLabel(side: string) {
  return ({ selectedRows }: { selectedRows: Row<Item>[] }) => (
    <span data-testid={`${side}-count`}>{selectedRows.length}</span>
  );
}

describe('Coordinating selection between the two lists', () => {
  it('selecting a row in the top list clears any selection in the bottom list', () => {
    render(
      <DualListTable<Item, Item>
        primary={{
          data: AVAILABLE,
          columns: COLUMNS,
          getRowId: (row) => row.id,
          bulkActions: bulkLabel('top'),
        }}
        secondary={{
          data: RESERVED,
          columns: COLUMNS,
          getRowId: (row) => row.id,
          bulkActions: bulkLabel('bottom'),
        }}
      />
    );

    const checkboxes = screen.getAllByLabelText('Select row');
    // Bottom list rows render after top list rows.
    fireEvent.click(checkboxes[2]);
    expect(screen.getByTestId('bottom-count').textContent).toBe('1');

    fireEvent.click(checkboxes[0]);
    expect(screen.getByTestId('top-count').textContent).toBe('1');
    expect(screen.queryByTestId('bottom-count')).toBeNull();
  });

  it('selecting a row in the bottom list clears any selection in the top list', () => {
    render(
      <DualListTable<Item, Item>
        primary={{
          data: AVAILABLE,
          columns: COLUMNS,
          getRowId: (row) => row.id,
          bulkActions: bulkLabel('top'),
        }}
        secondary={{
          data: RESERVED,
          columns: COLUMNS,
          getRowId: (row) => row.id,
          bulkActions: bulkLabel('bottom'),
        }}
      />
    );

    const checkboxes = screen.getAllByLabelText('Select row');
    fireEvent.click(checkboxes[0]);
    expect(screen.getByTestId('top-count').textContent).toBe('1');

    fireEvent.click(checkboxes[2]);
    expect(screen.getByTestId('bottom-count').textContent).toBe('1');
    expect(screen.queryByTestId('top-count')).toBeNull();
  });

  it('shows the label above each list when one is provided', () => {
    render(
      <DualListTable<Item, Item>
        primary={{
          data: AVAILABLE,
          columns: COLUMNS,
          getRowId: (row) => row.id,
          label: 'Available',
        }}
        secondary={{
          data: RESERVED,
          columns: COLUMNS,
          getRowId: (row) => row.id,
          label: 'Reserved',
        }}
      />
    );

    expect(screen.getByText('Available')).toBeTruthy();
    expect(screen.getByText('Reserved')).toBeTruthy();
  });

  it('lets both lists hold their own selection when independent mode is on', () => {
    render(
      <DualListTable<Item, Item>
        selectionMode="independent"
        primary={{
          data: AVAILABLE,
          columns: COLUMNS,
          getRowId: (row) => row.id,
          bulkActions: bulkLabel('top'),
        }}
        secondary={{
          data: RESERVED,
          columns: COLUMNS,
          getRowId: (row) => row.id,
          bulkActions: bulkLabel('bottom'),
        }}
      />
    );

    const checkboxes = screen.getAllByLabelText('Select row');
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[2]);

    expect(screen.getByTestId('top-count').textContent).toBe('1');
    expect(screen.getByTestId('bottom-count').textContent).toBe('1');
  });
});
