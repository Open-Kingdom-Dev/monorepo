import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import type { ColumnDef } from '@open-kingdom/shared-frontend-ui-data-table';
import { InvitationList } from './InvitationList.component';

const mockFindAllQuery = jest.fn();
const mockCancelInvitation = jest.fn();

jest.mock('@open-kingdom/shared-frontend-data-access-api-client', () => ({
  useInvitationsControllerFindAllQuery: () => mockFindAllQuery(),
  useInvitationsControllerCancelMutation: () => [
    mockCancelInvitation,
    { isLoading: false },
  ],
  useRolesControllerFindAllQuery: () => ({
    data: [
      { id: 1, name: 'admin' },
      { id: 2, name: 'user' },
      { id: 3, name: 'guest' },
    ],
  }),
}));

jest.mock('@open-kingdom/shared-frontend-data-access-notifications', () => ({
  showSuccessNotification: jest.fn((msg: string) => ({
    type: 'notify',
    payload: msg,
  })),
}));

let capturedColumns: ColumnDef<Record<string, unknown>>[] = [];
jest.mock('@open-kingdom/shared-frontend-ui-data-table', () => ({
  __esModule: true,
  DataTable: ({
    data,
    loading,
    columns,
  }: {
    data: Record<string, unknown>[];
    loading: boolean;
    columns: ColumnDef<Record<string, unknown>>[];
  }) => {
    capturedColumns = columns;
    const rows = data ?? [];
    return (
      <div data-testid="data-grid">
        {loading && <span>Loading...</span>}
        {!loading &&
          rows.map((row, i) => (
            <div key={i} data-testid="grid-row">
              {columns.map((col, j) => {
                let rendered: unknown;
                if ('cell' in col && typeof col.cell === 'function') {
                  rendered = (col.cell as CallableFunction)({
                    row: { original: row },
                  });
                } else if (
                  'accessorFn' in col &&
                  typeof col.accessorFn === 'function'
                ) {
                  rendered = (col.accessorFn as CallableFunction)(row, i);
                } else if ('accessorKey' in col && col.accessorKey) {
                  rendered = (row as Record<string, unknown>)[
                    col.accessorKey as string
                  ];
                }
                return <span key={j}>{rendered as React.ReactNode}</span>;
              })}
            </div>
          ))}
      </div>
    );
  },
}));

jest.mock('../shared/ConfirmDialog.component', () => ({
  __esModule: true,
  ConfirmDialog: ({
    isOpen,
    title,
    onConfirm,
    onCancel,
  }: {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading: boolean;
  }) =>
    isOpen ? (
      <div data-testid="confirm-dialog">
        <span>{title}</span>
        <button onClick={onConfirm}>Confirm</button>
        <button onClick={onCancel}>Dismiss</button>
      </div>
    ) : null,
}));

jest.mock('../shared/RoleBadge.component', () => ({
  __esModule: true,
  RoleBadge: ({ role }: { role: string }) => (
    <span data-testid="role-badge">{role}</span>
  ),
}));

jest.mock('../shared/StatusBadge.component', () => ({
  __esModule: true,
  StatusBadge: ({ status }: { status: string }) => (
    <span data-testid="status-badge">{status}</span>
  ),
}));

const store = configureStore({ reducer: {} });

function renderWithProviders(ui: React.ReactElement) {
  return render(<Provider store={store}>{ui}</Provider>);
}

const mockInvitations = [
  {
    id: 1,
    email: 'pending@test.com',
    tokenExpiry: Date.now() + 86400000,
    invitedBy: 1,
    invitedAt: Date.now() - 86400000,
    roleId: 2,
    status: 'pending',
  },
  {
    id: 3,
    email: 'expired@test.com',
    tokenExpiry: Date.now() - 86400000,
    invitedBy: 1,
    invitedAt: Date.now() - 604800000,
    roleId: 3,
    status: 'expired',
  },
];

describe('InvitationList', () => {
  beforeEach(() => {
    mockCancelInvitation.mockReset();
    mockCancelInvitation.mockReturnValue({
      unwrap: () => Promise.resolve(),
    });
    capturedColumns = [];
  });

  it('shows a loading indicator while invitations are being fetched', () => {
    mockFindAllQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    });
    renderWithProviders(<InvitationList />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows the invitation list with a heading', () => {
    mockFindAllQuery.mockReturnValue({
      data: mockInvitations,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    renderWithProviders(<InvitationList />);
    expect(screen.getByText('Invitations')).toBeInTheDocument();
    expect(screen.getAllByTestId('grid-row')).toHaveLength(2);
  });

  it('lets the user retry when loading invitations fails', () => {
    const refetch = jest.fn();
    mockFindAllQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 500 },
      refetch,
    });
    renderWithProviders(<InvitationList />);
    expect(screen.getByText('Failed to load invitations.')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Try again'));
    expect(refetch).toHaveBeenCalled();
  });

  it('shows a cancel button for all invitation statuses', () => {
    mockFindAllQuery.mockReturnValue({
      data: mockInvitations,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    renderWithProviders(<InvitationList />);

    const actionsCol = capturedColumns.find((c) => c.id === 'actions');
    const renderAction = (actionsCol as { cell: CallableFunction })
      ?.cell as CallableFunction;

    // All invitation statuses have a cancel button
    const pendingResult = renderAction({
      row: { original: mockInvitations[0] },
    });
    expect(pendingResult).not.toBeNull();

    const expiredResult = renderAction({
      row: { original: mockInvitations[1] },
    });
    expect(expiredResult).not.toBeNull();
  });

  it('displays placeholder values when invitation data is incomplete', () => {
    mockFindAllQuery.mockReturnValue({
      data: mockInvitations,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    renderWithProviders(<InvitationList />);

    const roleCol = capturedColumns.find((c) => c.id === 'role');
    const statusCol = capturedColumns.find(
      (c) => 'accessorKey' in c && c.accessorKey === 'status'
    );
    const invitedCol = capturedColumns.find((c) => c.id === 'invited');
    const expiresCol = capturedColumns.find((c) => c.id === 'expires');
    const actionsCol = capturedColumns.find((c) => c.id === 'actions');

    const nullRow = { row: { original: null } };

    // All renderers handle missing data without crashing
    expect((roleCol as { cell: CallableFunction })?.cell?.(nullRow)).toBeNull();
    expect(
      (statusCol as { cell: CallableFunction })?.cell?.(nullRow)
    ).toBeNull();
    expect(
      (invitedCol as { accessorFn: CallableFunction })?.accessorFn?.(null, 0)
    ).toBe('—');
    expect(
      (expiresCol as { accessorFn: CallableFunction })?.accessorFn?.(null, 0)
    ).toBe('—');
    expect(
      (actionsCol as { cell: CallableFunction })?.cell?.(nullRow)
    ).toBeNull();
  });

  it('asks for confirmation before cancelling an invitation', async () => {
    mockFindAllQuery.mockReturnValue({
      data: mockInvitations,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    renderWithProviders(<InvitationList />);

    const actionsCol = capturedColumns.find((c) => c.id === 'actions');
    const { container } = render(
      <Provider store={store}>
        {(actionsCol as { cell: CallableFunction })?.cell?.({
          row: { original: mockInvitations[0] },
        })}
      </Provider>
    );
    const cancelBtn = container.querySelector('button');
    expect(cancelBtn).toBeTruthy();
    fireEvent.click(cancelBtn as HTMLElement);

    await waitFor(() => {
      expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Confirm'));
    await waitFor(() => {
      expect(mockCancelInvitation).toHaveBeenCalledWith({ id: 1 });
    });
  });

  it('closes the confirmation dialog without cancelling when dismissed', async () => {
    mockFindAllQuery.mockReturnValue({
      data: mockInvitations,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    renderWithProviders(<InvitationList />);

    const actionsCol = capturedColumns.find((c) => c.id === 'actions');
    const { container } = render(
      <Provider store={store}>
        {(actionsCol as { cell: CallableFunction })?.cell?.({
          row: { original: mockInvitations[0] },
        })}
      </Provider>
    );
    fireEvent.click(container.querySelector('button') as HTMLElement);

    await waitFor(() => {
      expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Dismiss'));
    await waitFor(() => {
      expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();
    });
    expect(mockCancelInvitation).not.toHaveBeenCalled();
  });

  it('still closes the dialog when cancellation fails', async () => {
    mockCancelInvitation.mockReturnValue({
      unwrap: () => Promise.reject(new Error('Server error')),
    });
    mockFindAllQuery.mockReturnValue({
      data: mockInvitations,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    renderWithProviders(<InvitationList />);

    const actionsCol = capturedColumns.find((c) => c.id === 'actions');
    const { container } = render(
      <Provider store={store}>
        {(actionsCol as { cell: CallableFunction })?.cell?.({
          row: { original: mockInvitations[0] },
        })}
      </Provider>
    );
    fireEvent.click(container.querySelector('button') as HTMLElement);

    await waitFor(() => {
      expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Confirm'));
    await waitFor(() => {
      expect(mockCancelInvitation).toHaveBeenCalledWith({ id: 1 });
    });
    await waitFor(() => {
      expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();
    });
  });
});
