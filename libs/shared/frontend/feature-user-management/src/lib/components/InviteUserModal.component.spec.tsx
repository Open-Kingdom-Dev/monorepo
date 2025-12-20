import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { InviteUserModal } from './InviteUserModal.component';

jest.mock('@react-hookz/web', () => ({
  useUpdateEffect: jest.fn(),
}));

jest.mock('@hookform/resolvers/zod', () => ({
  zodResolver: () => () => ({ values: {}, errors: {} }),
}));

jest.mock('../api', () => ({
  createUserManagementEndpoints: jest.fn(),
}));

const mockInviteUser = jest.fn();
const mockListRolesQuery = { data: [] };

describe('Invite User Modal', () => {
  const createMockApi = (overrides = {}) => ({
    injectEndpoints: jest.fn().mockReturnValue({
      useInviteUserMutation: () => [
        mockInviteUser.mockResolvedValue({ data: undefined }),
        { isLoading: false, error: null },
      ],
      useListRolesQuery: () => mockListRolesQuery,
      ...overrides,
    }),
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('hides the form when modal is closed', () => {
    render(
      <InviteUserModal
        api={createMockApi() as never}
        isOpen={false}
        onClose={jest.fn()}
      />
    );

    expect(screen.queryByText('Invite New User')).toBeNull();
  });

  it('displays form fields for entering user details', () => {
    render(
      <InviteUserModal
        api={createMockApi() as never}
        isOpen={true}
        onClose={jest.fn()}
      />
    );

    expect(screen.getByText('Invite New User')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('user@example.com')).toBeInTheDocument();
    expect(screen.getByText('First Name')).toBeInTheDocument();
    expect(screen.getByText('Last Name')).toBeInTheDocument();
    expect(screen.getByText('Role')).toBeInTheDocument();
  });

  it('allows selecting a role for the invited user', () => {
    render(
      <InviteUserModal
        api={createMockApi() as never}
        isOpen={true}
        onClose={jest.fn()}
      />
    );

    expect(screen.getByRole('option', { name: 'Guest' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'User' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Admin' })).toBeInTheDocument();
  });

  it('closes when user clicks cancel', () => {
    const onClose = jest.fn();

    render(
      <InviteUserModal
        api={createMockApi() as never}
        isOpen={true}
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalled();
  });

  it('allows user to send the invitation', () => {
    render(
      <InviteUserModal
        api={createMockApi() as never}
        isOpen={true}
        onClose={jest.fn()}
      />
    );

    expect(
      screen.getByRole('button', { name: 'Send Invitation' })
    ).toBeInTheDocument();
  });

  it('disables submit button while invitation is being sent', () => {
    const api = createMockApi();
    api.injectEndpoints = jest.fn().mockReturnValue({
      useInviteUserMutation: () => [
        mockInviteUser,
        { isLoading: true, error: null },
      ],
      useListRolesQuery: () => mockListRolesQuery,
    });

    render(
      <InviteUserModal api={api as never} isOpen={true} onClose={jest.fn()} />
    );

    expect(screen.getByRole('button', { name: 'Sending...' })).toBeDisabled();
  });
});
