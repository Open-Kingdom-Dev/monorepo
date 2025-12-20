import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UsersTab } from './UsersTab.component';
import { useUsersApi } from '../hooks';

jest.mock('../../../components/InviteUserModal.component', () => ({
  InviteUserModal: ({
    isOpen,
    onClose,
  }: {
    isOpen: boolean;
    onClose: () => void;
  }) =>
    isOpen ? (
      <div data-testid="invite-modal">
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

jest.mock('../hooks', () => ({
  useUsersApi: jest.fn(),
}));

jest.mock('../components', () => ({
  UsersTable: ({
    users,
    onDelete,
  }: {
    users: Array<{ id: number; email: string }>;
    onDelete: (id: number) => void;
  }) => (
    <div data-testid="users-table">
      {users.map((user) => (
        <div key={user.id}>
          <span>{user.email}</span>
          <button onClick={() => onDelete(user.id)}>Delete</button>
        </div>
      ))}
    </div>
  ),
}));

const mockUseUsersApi = useUsersApi as jest.Mock;

describe('Users Tab', () => {
  const mockUsers = [
    { id: 1, email: 'admin@example.com', firstName: 'Admin', lastName: 'User' },
    { id: 2, email: 'john@example.com', firstName: 'John', lastName: 'Doe' },
  ];

  const createMockApi = () => ({
    injectEndpoints: jest.fn().mockReturnThis(),
    useListUsersQuery: jest.fn(),
    useDeleteUserMutation: jest.fn(),
    useInviteUserMutation: jest.fn(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading message while users are being fetched', () => {
    mockUseUsersApi.mockReturnValue({
      users: undefined,
      isLoading: true,
      error: null,
      deleteUser: jest.fn(),
      refetch: jest.fn(),
    });

    render(
      <UsersTab
        api={createMockApi() as never}
        injectedApi={createMockApi() as never}
      />
    );

    expect(screen.getByText('Loading users...')).toBeInTheDocument();
  });

  it('shows error message when users cannot be loaded', () => {
    mockUseUsersApi.mockReturnValue({
      users: undefined,
      isLoading: false,
      error: new Error('Failed'),
      deleteUser: jest.fn(),
      refetch: jest.fn(),
    });

    render(
      <UsersTab
        api={createMockApi() as never}
        injectedApi={createMockApi() as never}
      />
    );

    expect(screen.getByText('Failed to load users')).toBeInTheDocument();
  });

  it('informs user when no users exist', () => {
    mockUseUsersApi.mockReturnValue({
      users: [],
      isLoading: false,
      error: null,
      deleteUser: jest.fn(),
      refetch: jest.fn(),
    });

    render(
      <UsersTab
        api={createMockApi() as never}
        injectedApi={createMockApi() as never}
      />
    );

    expect(screen.getByText('No users found')).toBeInTheDocument();
  });

  it('displays all users with their emails', () => {
    mockUseUsersApi.mockReturnValue({
      users: mockUsers,
      isLoading: false,
      error: null,
      deleteUser: jest.fn(),
      refetch: jest.fn(),
    });

    render(
      <UsersTab
        api={createMockApi() as never}
        injectedApi={createMockApi() as never}
      />
    );

    expect(screen.getByText('admin@example.com')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('opens invite form when clicking Invite User button', () => {
    mockUseUsersApi.mockReturnValue({
      users: mockUsers,
      isLoading: false,
      error: null,
      deleteUser: jest.fn(),
      refetch: jest.fn(),
    });

    render(
      <UsersTab
        api={createMockApi() as never}
        injectedApi={createMockApi() as never}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Invite User' }));

    expect(screen.getByTestId('invite-modal')).toBeInTheDocument();
  });

  it('closes invite form when dismissed', () => {
    mockUseUsersApi.mockReturnValue({
      users: mockUsers,
      isLoading: false,
      error: null,
      deleteUser: jest.fn(),
      refetch: jest.fn(),
    });

    render(
      <UsersTab
        api={createMockApi() as never}
        injectedApi={createMockApi() as never}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Invite User' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(screen.queryByTestId('invite-modal')).not.toBeInTheDocument();
  });

  it('supports custom table renderer for alternative displays', () => {
    mockUseUsersApi.mockReturnValue({
      users: mockUsers,
      isLoading: false,
      error: null,
      deleteUser: jest.fn(),
      refetch: jest.fn(),
    });

    const renderTable = jest
      .fn()
      .mockReturnValue(<div data-testid="custom-table">Custom</div>);

    render(
      <UsersTab
        api={createMockApi() as never}
        injectedApi={createMockApi() as never}
        renderTable={renderTable}
      />
    );

    expect(screen.getByTestId('custom-table')).toBeInTheDocument();
  });
});
