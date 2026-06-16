import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import type { ColumnDef } from '@open-kingdom/shared-frontend-ui-data-table';
import { UserList } from './UserList.component';

const mockFindAllQuery = jest.fn();
const mockDeleteUser = jest.fn();
const mockHasPermission = jest.fn();

jest.mock('@open-kingdom/shared-frontend-data-access-api-client', () => ({
  useUsersControllerFindAllQuery: () => mockFindAllQuery(),
  useUsersControllerDeleteMutation: () => [
    mockDeleteUser,
    { isLoading: false },
  ],
  useInvitationsControllerInviteMutation: () => [
    jest.fn(),
    { isLoading: false, error: null },
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

jest.mock('../../hooks/useHasPermission', () => ({
  __esModule: true,
  useHasPermission: (...args: unknown[]) => mockHasPermission(...args),
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
        <button onClick={onCancel}>Cancel</button>
      </div>
    ) : null,
}));

jest.mock('../shared/RoleBadge.component', () => ({
  __esModule: true,
  RoleBadge: ({ role }: { role: string }) => (
    <span data-testid="role-badge">{role}</span>
  ),
}));

jest.mock('../invitations', () => ({
  __esModule: true,
  InviteUserModal: ({
    isOpen,
    onClose,
  }: {
    isOpen: boolean;
    onClose: () => void;
  }) =>
    isOpen ? (
      <div data-testid="invite-modal">
        <button onClick={onClose}>Close Invite</button>
      </div>
    ) : null,
}));

jest.mock('./RoleChangeModal.component', () => ({
  __esModule: true,
  RoleChangeModal: ({
    isOpen,
    onClose,
  }: {
    isOpen: boolean;
    onClose: () => void;
    user: { id: number; email: string; role: string };
  }) =>
    isOpen ? (
      <div data-testid="role-change-modal">
        <button onClick={onClose}>Close Role Change</button>
      </div>
    ) : null,
}));

const store = configureStore({ reducer: {} });

function renderWithProviders(ui: React.ReactElement) {
  return render(<Provider store={store}>{ui}</Provider>);
}

const mockUsers = [
  {
    id: 1,
    email: 'admin@test.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
  },
  {
    id: 2,
    email: 'guest@test.com',
    firstName: null,
    lastName: null,
    role: 'guest',
  },
];

describe('UserList', () => {
  beforeEach(() => {
    mockDeleteUser.mockReset();
    mockDeleteUser.mockReturnValue({ unwrap: () => Promise.resolve() });
    mockHasPermission.mockReturnValue(true);
    capturedColumns = [];
  });

  it('shows a loading indicator while fetching users', () => {
    mockFindAllQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    });
    renderWithProviders(<UserList />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows the user list with an invite button', () => {
    mockFindAllQuery.mockReturnValue({
      data: mockUsers,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    renderWithProviders(<UserList />);
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Invite User')).toBeInTheDocument();
  });

  it('shows an error with a retry option when loading fails', () => {
    mockFindAllQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 500 },
      refetch: jest.fn(),
    });
    renderWithProviders(<UserList />);
    expect(screen.getByText('Failed to load users.')).toBeInTheDocument();
    expect(screen.getByText('Try again')).toBeInTheDocument();
  });

  it('retries loading users when clicking "Try again"', () => {
    const refetch = jest.fn();
    mockFindAllQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 500 },
      refetch,
    });
    renderWithProviders(<UserList />);
    fireEvent.click(screen.getByText('Try again'));
    expect(refetch).toHaveBeenCalled();
  });

  it('asks for confirmation before deleting a user', async () => {
    mockFindAllQuery.mockReturnValue({
      data: mockUsers,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    renderWithProviders(<UserList currentUserId={1} />);

    const actionsCol = capturedColumns.find((c) => c.id === 'actions');
    const { container } = render(
      <Provider store={store}>
        {(actionsCol as { cell: CallableFunction })?.cell?.({
          row: { original: mockUsers[1] },
        })}
      </Provider>
    );
    const deleteBtn = Array.from(container.querySelectorAll('button')).find(
      (btn) => btn.textContent === 'Delete'
    );
    expect(deleteBtn).toBeTruthy();
    fireEvent.click(deleteBtn as HTMLElement);

    await waitFor(() => {
      expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Confirm'));
    await waitFor(() => {
      expect(mockDeleteUser).toHaveBeenCalledWith({ id: 2 });
    });
  });

  it('still closes the dialog when deletion fails', async () => {
    mockDeleteUser.mockReturnValue({
      unwrap: () => Promise.reject(new Error('Server error')),
    });
    mockFindAllQuery.mockReturnValue({
      data: mockUsers,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    renderWithProviders(<UserList currentUserId={1} />);

    const actionsCol = capturedColumns.find((c) => c.id === 'actions');
    const { container } = render(
      <Provider store={store}>
        {(actionsCol as { cell: CallableFunction })?.cell?.({
          row: { original: mockUsers[1] },
        })}
      </Provider>
    );
    const deleteBtn = Array.from(container.querySelectorAll('button')).find(
      (btn) => btn.textContent === 'Delete'
    );
    fireEvent.click(deleteBtn as HTMLElement);

    await waitFor(() => {
      expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Confirm'));
    await waitFor(() => {
      expect(mockDeleteUser).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();
    });
  });

  it('hides delete and role change buttons when the user lacks permissions', () => {
    mockHasPermission.mockReturnValue(false);
    mockFindAllQuery.mockReturnValue({
      data: mockUsers,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    renderWithProviders(<UserList />);

    const actionsCol = capturedColumns.find((c) => c.id === 'actions');
    const { container } = render(
      <Provider store={store}>
        {(actionsCol as { cell: CallableFunction })?.cell?.({
          row: { original: mockUsers[0] },
        })}
      </Provider>
    );
    expect(container.querySelectorAll('button')).toHaveLength(0);
  });

  it('lets the user back out of inviting a new teammate', () => {
    mockFindAllQuery.mockReturnValue({
      data: mockUsers,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    renderWithProviders(<UserList />);
    fireEvent.click(screen.getByText('Invite User'));
    expect(screen.getByTestId('invite-modal')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Close Invite'));
    expect(screen.queryByTestId('invite-modal')).not.toBeInTheDocument();
  });

  it('lets the user back out of changing a teammate role', () => {
    mockFindAllQuery.mockReturnValue({
      data: mockUsers,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    renderWithProviders(<UserList currentUserId={1} />);

    const actionsCol = capturedColumns.find((c) => c.id === 'actions');
    const { container } = render(
      <Provider store={store}>
        {(actionsCol as { cell: CallableFunction })?.cell?.({
          row: { original: mockUsers[1] },
        })}
      </Provider>
    );
    const changeBtn = Array.from(container.querySelectorAll('button')).find(
      (btn) => btn.textContent === 'Change Role'
    );
    fireEvent.click(changeBtn as HTMLElement);
    expect(screen.getByTestId('role-change-modal')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Close Role Change'));
    expect(screen.queryByTestId('role-change-modal')).not.toBeInTheDocument();
  });

  it('lets the user back out of deleting a teammate', async () => {
    mockFindAllQuery.mockReturnValue({
      data: mockUsers,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    renderWithProviders(<UserList currentUserId={1} />);

    const actionsCol = capturedColumns.find((c) => c.id === 'actions');
    const { container } = render(
      <Provider store={store}>
        {(actionsCol as { cell: CallableFunction })?.cell?.({
          row: { original: mockUsers[1] },
        })}
      </Provider>
    );
    const deleteBtn = Array.from(container.querySelectorAll('button')).find(
      (btn) => btn.textContent === 'Delete'
    );
    fireEvent.click(deleteBtn as HTMLElement);
    await waitFor(() => {
      expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Cancel'));
    expect(mockDeleteUser).not.toHaveBeenCalled();
    expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();
  });

  it('shows the change role button when the user has role update permission', () => {
    mockHasPermission.mockImplementation(
      (resource: string, action: string) =>
        resource === 'roles' && action === 'update'
    );
    mockFindAllQuery.mockReturnValue({
      data: mockUsers,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    renderWithProviders(<UserList currentUserId={1} />);

    const actionsCol = capturedColumns.find((c) => c.id === 'actions');
    const { container } = render(
      <Provider store={store}>
        {(actionsCol as { cell: CallableFunction })?.cell?.({
          row: { original: mockUsers[1] },
        })}
      </Provider>
    );
    const buttons = Array.from(container.querySelectorAll('button'));
    expect(buttons.map((b) => b.textContent)).toContain('Change Role');
    expect(buttons.map((b) => b.textContent)).not.toContain('Delete');
  });
});
