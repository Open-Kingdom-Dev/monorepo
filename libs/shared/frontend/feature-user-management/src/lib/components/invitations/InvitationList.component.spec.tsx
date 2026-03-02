import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import type { ColDef } from '@open-kingdom/shared-frontend-ui-datagrid';
import { InvitationList } from './InvitationList.component';

const mockFindAllQuery = jest.fn();
const mockCancelInvitation = jest.fn();

jest.mock('@open-kingdom/shared-frontend-data-access-api-client', () => ({
  useInvitationsControllerFindAllQuery: () => mockFindAllQuery(),
  useInvitationsControllerCancelMutation: () => [
    mockCancelInvitation,
    { isLoading: false },
  ],
}));

jest.mock('@open-kingdom/shared-frontend-data-access-notifications', () => ({
  showSuccessNotification: jest.fn((msg: string) => ({
    type: 'notify',
    payload: msg,
  })),
}));

jest.mock('@open-kingdom/shared-frontend-ui-theme', () => ({
  __esModule: true,
  useTheme: () => ({ theme: {}, mode: 'light' }),
}));

let capturedColumnDefs: ColDef[] = [];
jest.mock('@open-kingdom/shared-frontend-ui-datagrid', () => ({
  __esModule: true,
  DataGrid: ({
    rowData,
    loading,
    columnDefs,
  }: {
    rowData: Record<string, unknown>[];
    loading: boolean;
    columnDefs: ColDef[];
  }) => {
    capturedColumnDefs = columnDefs;
    const rows = rowData ?? [];
    return (
      <div data-testid="data-grid">
        {loading && <span>Loading...</span>}
        {!loading &&
          rows.map((row, i) => (
            <div key={i} data-testid="grid-row">
              {columnDefs.map((col, j) => {
                const value = col.valueGetter
                  ? (col.valueGetter as CallableFunction)({ data: row })
                  : (row as Record<string, unknown>)[col.field as string];
                const rendered = col.cellRenderer
                  ? (col.cellRenderer as CallableFunction)({ data: row })
                  : value;
                return <span key={j}>{rendered}</span>;
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
    role: 'user',
    status: 'pending',
  },
  {
    id: 3,
    email: 'expired@test.com',
    tokenExpiry: Date.now() - 86400000,
    invitedBy: 1,
    invitedAt: Date.now() - 604800000,
    role: 'guest',
    status: 'expired',
  },
];

describe('InvitationList', () => {
  beforeEach(() => {
    mockCancelInvitation.mockReset();
    mockCancelInvitation.mockReturnValue({
      unwrap: () => Promise.resolve(),
    });
    capturedColumnDefs = [];
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

    const actionsCol = capturedColumnDefs.find(
      (c) => c.headerName === 'Actions'
    );
    const renderAction = actionsCol?.cellRenderer as CallableFunction;

    // All invitation statuses have a cancel button
    const pendingResult = renderAction({ data: mockInvitations[0] });
    expect(pendingResult).not.toBeNull();

    const expiredResult = renderAction({ data: mockInvitations[1] });
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

    const roleCol = capturedColumnDefs.find((c) => c.field === 'role');
    const statusCol = capturedColumnDefs.find((c) => c.field === 'status');
    const invitedCol = capturedColumnDefs.find(
      (c) => c.headerName === 'Invited'
    );
    const expiresCol = capturedColumnDefs.find(
      (c) => c.headerName === 'Expires'
    );
    const actionsCol = capturedColumnDefs.find(
      (c) => c.headerName === 'Actions'
    );

    // All renderers handle missing data without crashing
    expect(
      (roleCol?.cellRenderer as CallableFunction)({ data: null })
    ).toBeNull();
    expect(
      (statusCol?.cellRenderer as CallableFunction)({ data: null })
    ).toBeNull();
    expect((invitedCol?.valueGetter as CallableFunction)({ data: null })).toBe(
      '—'
    );
    expect((expiresCol?.valueGetter as CallableFunction)({ data: null })).toBe(
      '—'
    );
    expect(
      (actionsCol?.cellRenderer as CallableFunction)({ data: null })
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

    const actionsCol = capturedColumnDefs.find(
      (c) => c.headerName === 'Actions'
    );
    const { container } = render(
      <Provider store={store}>
        {(actionsCol?.cellRenderer as CallableFunction)({
          data: mockInvitations[0],
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

    const actionsCol = capturedColumnDefs.find(
      (c) => c.headerName === 'Actions'
    );
    const { container } = render(
      <Provider store={store}>
        {(actionsCol?.cellRenderer as CallableFunction)({
          data: mockInvitations[0],
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

    const actionsCol = capturedColumnDefs.find(
      (c) => c.headerName === 'Actions'
    );
    const { container } = render(
      <Provider store={store}>
        {(actionsCol?.cellRenderer as CallableFunction)({
          data: mockInvitations[0],
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
