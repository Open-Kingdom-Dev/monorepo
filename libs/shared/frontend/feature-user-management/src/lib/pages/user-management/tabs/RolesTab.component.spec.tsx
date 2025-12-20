import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RolesTab } from './RolesTab.component';
import { useRolesApi } from '../hooks';

jest.mock('../hooks', () => ({
  useRolesApi: jest.fn(),
}));

jest.mock('../components', () => ({
  RolesTable: ({
    roles,
    onDelete,
  }: {
    roles: Array<{ id: number; name: string }>;
    onDelete: (id: number) => void;
  }) => (
    <div data-testid="roles-table">
      {roles.map((role) => (
        <div key={role.id}>
          <span>{role.name}</span>
          <button onClick={() => onDelete(role.id)}>Delete</button>
        </div>
      ))}
    </div>
  ),
  CreateRoleForm: ({
    onSubmit,
    isLoading,
  }: {
    onSubmit: () => void;
    isLoading: boolean;
  }) => (
    <form
      data-testid="create-role-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create'}
      </button>
    </form>
  ),
}));

const mockUseRolesApi = useRolesApi as jest.Mock;

describe('Roles Tab', () => {
  const mockRoles = [
    { id: 1, name: 'Manager', description: 'Can manage team' },
    { id: 2, name: 'Editor', description: 'Can edit content' },
  ];

  const createMockApi = () => ({
    useListRolesQuery: jest.fn(),
    useDeleteRoleMutation: jest.fn(),
    useCreateRoleMutation: jest.fn(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading message while roles are being fetched', () => {
    mockUseRolesApi.mockReturnValue({
      roles: undefined,
      isLoading: true,
      isCreating: false,
      deleteRole: jest.fn(),
      createRole: jest.fn(),
    });

    render(<RolesTab injectedApi={createMockApi() as never} />);

    expect(screen.getByText('Loading roles...')).toBeInTheDocument();
  });

  it('informs user when no custom roles have been created', () => {
    mockUseRolesApi.mockReturnValue({
      roles: [],
      isLoading: false,
      isCreating: false,
      deleteRole: jest.fn(),
      createRole: jest.fn(),
    });

    render(<RolesTab injectedApi={createMockApi() as never} />);

    expect(screen.getByText('No custom roles created yet')).toBeInTheDocument();
  });

  it('displays all available roles', () => {
    mockUseRolesApi.mockReturnValue({
      roles: mockRoles,
      isLoading: false,
      isCreating: false,
      deleteRole: jest.fn(),
      createRole: jest.fn(),
    });

    render(<RolesTab injectedApi={createMockApi() as never} />);

    expect(screen.getByText('Manager')).toBeInTheDocument();
    expect(screen.getByText('Editor')).toBeInTheDocument();
  });

  it('allows creating new roles', () => {
    mockUseRolesApi.mockReturnValue({
      roles: mockRoles,
      isLoading: false,
      isCreating: false,
      deleteRole: jest.fn(),
      createRole: jest.fn(),
    });

    render(<RolesTab injectedApi={createMockApi() as never} />);

    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
  });

  it('disables create button while role creation is in progress', () => {
    mockUseRolesApi.mockReturnValue({
      roles: mockRoles,
      isLoading: false,
      isCreating: true,
      deleteRole: jest.fn(),
      createRole: jest.fn(),
    });

    render(<RolesTab injectedApi={createMockApi() as never} />);

    expect(screen.getByRole('button', { name: 'Creating...' })).toBeDisabled();
  });
});
