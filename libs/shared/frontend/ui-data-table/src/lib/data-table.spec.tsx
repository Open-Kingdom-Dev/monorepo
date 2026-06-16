import { useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ColumnDef, TableState, Updater } from '@tanstack/react-table';
import { DataTable } from './data-table';

interface Person {
  id: string;
  name: string;
  age: number;
}

const PEOPLE: Person[] = [
  { id: '1', name: 'Ada', age: 36 },
  { id: '2', name: 'Grace', age: 85 },
  { id: '3', name: 'Linus', age: 54 },
];

const COLUMNS: ColumnDef<Person>[] = [
  { id: 'name', accessorKey: 'name', header: 'Name' },
  { id: 'age', accessorKey: 'age', header: 'Age' },
];

beforeEach(() => {
  globalThis.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('What people see', () => {
  it('shows the columns and the people in the list', () => {
    render(<DataTable<Person> data={PEOPLE} columns={COLUMNS} />);
    expect(screen.getByText('Name')).toBeTruthy();
    expect(screen.getByText('Ada')).toBeTruthy();
    expect(screen.getByText('Linus')).toBeTruthy();
  });

  it('tells people there are no results when the list is empty', () => {
    render(<DataTable<Person> data={[]} columns={COLUMNS} />);
    expect(screen.getByText('No results')).toBeTruthy();
  });

  it('shows the message you wrote when the list is empty', () => {
    render(
      <DataTable<Person>
        data={[]}
        columns={COLUMNS}
        emptyState={{ title: 'Nothing here', description: 'Try again later.' }}
      />
    );
    expect(screen.getByText('Nothing here')).toBeTruthy();
    expect(screen.getByText('Try again later.')).toBeTruthy();
  });

  it('lets you render your own empty state', () => {
    render(
      <DataTable<Person>
        data={[]}
        columns={COLUMNS}
        emptyState={() => <div>Invite your first user</div>}
      />
    );
    expect(screen.getByText('Invite your first user')).toBeTruthy();
  });

  it('shows a placeholder while the data is loading', () => {
    const { container } = render(
      <DataTable<Person>
        data={[]}
        columns={COLUMNS}
        loading
        skeletonRowCount={3}
      />
    );
    // Three placeholder rows × two columns = six placeholder cells.
    expect(container.querySelectorAll('.animate-pulse').length).toBe(6);
  });
});

describe('Sorting', () => {
  it('sorts a column when its header is clicked, then reverses, then clears', () => {
    render(<DataTable<Person> data={PEOPLE} columns={COLUMNS} />);
    const nameHeader = () =>
      screen.getByRole('columnheader', { name: /name/i });
    expect(nameHeader().getAttribute('aria-sort')).toBe('none');
    fireEvent.click(screen.getByRole('button', { name: /name/i }));
    expect(nameHeader().getAttribute('aria-sort')).toBe('ascending');
    fireEvent.click(screen.getByRole('button', { name: /name/i }));
    expect(nameHeader().getAttribute('aria-sort')).toBe('descending');
  });
});

describe('Selecting rows', () => {
  it('does not show row checkboxes by default', () => {
    render(<DataTable<Person> data={PEOPLE} columns={COLUMNS} />);
    expect(screen.queryByLabelText('Select row')).toBeNull();
  });

  it('selects a row when its checkbox is clicked', () => {
    render(
      <DataTable<Person>
        data={PEOPLE}
        columns={COLUMNS}
        getRowId={(row) => row.id}
        enableRowSelection
      />
    );
    const checkboxes = screen.getAllByLabelText('Select row');
    fireEvent.click(checkboxes[0]);
    expect(checkboxes[0].getAttribute('aria-checked')).toBe('true');
  });

  it('selects every row on the page from the header checkbox', () => {
    render(
      <DataTable<Person>
        data={PEOPLE}
        columns={COLUMNS}
        getRowId={(row) => row.id}
        enableRowSelection
      />
    );
    fireEvent.click(screen.getByLabelText('Select all rows on this page'));
    screen
      .getAllByLabelText('Select row')
      .forEach((cb) => expect(cb.getAttribute('aria-checked')).toBe('true'));
  });

  it('shows bulk actions only after rows are selected, and clears them afterwards', () => {
    render(
      <DataTable<Person>
        data={PEOPLE}
        columns={COLUMNS}
        getRowId={(row) => row.id}
        enableRowSelection
        bulkActions={({ selectedRows, clearSelection }) => (
          <button onClick={clearSelection}>
            Schedule {selectedRows.length}
          </button>
        )}
      />
    );
    expect(screen.queryByText(/Schedule/)).toBeNull();
    fireEvent.click(screen.getAllByLabelText('Select row')[0]);
    expect(screen.getByText('Schedule 1')).toBeTruthy();
    fireEvent.click(screen.getByText('Schedule 1'));
    expect(screen.queryByText(/Schedule/)).toBeNull();
  });
});

describe('Opening a row', () => {
  it('opens a row when the user presses Enter or Space', () => {
    const onRowClick = vi.fn();
    render(
      <DataTable<Person>
        data={PEOPLE}
        columns={COLUMNS}
        getRowId={(row) => row.id}
        onRowClick={onRowClick}
      />
    );
    const adaRow = screen.getByText('Ada').closest('tr') as Element;
    fireEvent.keyDown(adaRow, { key: 'Enter' });
    fireEvent.keyDown(adaRow, { key: ' ' });
    expect(onRowClick).toHaveBeenCalledTimes(2);
  });
});

describe('Browsing long lists', () => {
  const MANY = Array.from({ length: 25 }).map((_, i) => ({
    id: String(i),
    name: `Person ${i}`,
    age: i,
  }));

  it('lets people page through the list', () => {
    render(
      <DataTable<Person>
        data={MANY}
        columns={COLUMNS}
        getRowId={(row) => row.id}
        enablePagination
      />
    );
    expect(screen.getByLabelText('Go to next page')).toBeTruthy();
  });
});

describe('Searching the list', () => {
  it('filters the visible rows shortly after the user finishes typing', async () => {
    vi.useFakeTimers();
    render(
      <DataTable<Person>
        data={PEOPLE}
        columns={COLUMNS}
        getRowId={(row) => row.id}
        enableGlobalFilter
      />
    );
    const search = screen.getByLabelText('Search') as HTMLInputElement;
    fireEvent.change(search, { target: { value: 'Ada' } });
    expect(screen.queryByText('Linus')).toBeTruthy();
    await act(async () => {
      vi.advanceTimersByTime(250);
    });
    expect(screen.queryByText('Linus')).toBeNull();
    expect(screen.getByText('Ada')).toBeTruthy();
    vi.useRealTimers();
  });
});

describe('Remembering preferences across reloads', () => {
  it('keeps the sort order after the page reloads', async () => {
    vi.useFakeTimers();
    const { unmount } = render(
      <DataTable<Person>
        data={PEOPLE}
        columns={COLUMNS}
        getRowId={(row) => row.id}
        persistStateKey="people-grid"
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /name/i }));
    await act(async () => {
      vi.advanceTimersByTime(250);
    });
    unmount();

    render(
      <DataTable<Person>
        data={PEOPLE}
        columns={COLUMNS}
        getRowId={(row) => row.id}
        persistStateKey="people-grid"
      />
    );
    expect(
      screen
        .getByRole('columnheader', { name: /name/i })
        .getAttribute('aria-sort')
    ).toBe('ascending');
    vi.useRealTimers();
  });

  it('starts fresh when the saved preferences are corrupted', () => {
    globalThis.localStorage.setItem('ok-data-table:v1:bad', '{not-json');
    render(
      <DataTable<Person>
        data={PEOPLE}
        columns={COLUMNS}
        getRowId={(row) => row.id}
        persistStateKey="bad"
      />
    );
    expect(globalThis.localStorage.getItem('ok-data-table:v1:bad')).toBeNull();
  });

  it('starts fresh when the saved preferences are from an older version', () => {
    globalThis.localStorage.setItem(
      'ok-data-table:v1:mismatch',
      JSON.stringify({ version: 99 })
    );
    render(
      <DataTable<Person>
        data={PEOPLE}
        columns={COLUMNS}
        getRowId={(row) => row.id}
        persistStateKey="mismatch"
      />
    );
    expect(
      globalThis.localStorage.getItem('ok-data-table:v1:mismatch')
    ).toBeNull();
  });

  it('forgets which rows were selected on the previous visit', async () => {
    vi.useFakeTimers();
    render(
      <DataTable<Person>
        data={PEOPLE}
        columns={COLUMNS}
        getRowId={(row) => row.id}
        persistStateKey="no-selection"
        enableRowSelection
      />
    );
    fireEvent.click(screen.getAllByLabelText('Select row')[0]);
    await act(async () => {
      vi.advanceTimersByTime(250);
    });
    const saved = JSON.parse(
      globalThis.localStorage.getItem('ok-data-table:v1:no-selection') ?? '{}'
    );
    expect(saved.rowSelection).toBeUndefined();
    vi.useRealTimers();
  });
});

describe('When the parent owns the state', () => {
  it('shows the sort order set by the parent', () => {
    function Controlled() {
      const [state, setState] = useState<TableState>({
        sorting: [{ id: 'name', desc: true }],
      } as TableState);
      const onStateChange = (updater: Updater<TableState>) =>
        setState((prev) =>
          typeof updater === 'function' ? updater(prev) : updater
        );
      return (
        <DataTable<Person>
          data={PEOPLE}
          columns={COLUMNS}
          getRowId={(row) => row.id}
          state={state}
          onStateChange={onStateChange}
        />
      );
    }
    render(<Controlled />);
    expect(
      screen
        .getByRole('columnheader', { name: /name/i })
        .getAttribute('aria-sort')
    ).toBe('descending');
  });
});

describe('Pinning a column to the side', () => {
  it('keeps the pinned column visible while the rest of the table scrolls', () => {
    render(
      <DataTable<Person>
        data={PEOPLE}
        columns={COLUMNS}
        getRowId={(row) => row.id}
        initialColumnPinning={{ left: ['name'] }}
      />
    );
    const nameHeader = screen.getByRole('columnheader', { name: /name/i });
    expect(nameHeader.className).toContain('sticky');
  });
});

describe('Variable row heights', () => {
  it('lets older rows be taller than younger rows', () => {
    render(
      <DataTable<Person>
        data={PEOPLE}
        columns={COLUMNS}
        getRowId={(row) => row.id}
        rowHeight={(row) => (row.original.age > 50 ? 80 : 40)}
      />
    );
    const ada = screen.getByText('Ada').closest('tr') as HTMLElement;
    const grace = screen.getByText('Grace').closest('tr') as HTMLElement;
    expect(ada.style.height).toBe('40px');
    expect(grace.style.height).toBe('80px');
  });
});
