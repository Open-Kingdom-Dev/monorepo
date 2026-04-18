import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { RolePermissionsModal } from './RolePermissionsModal.component';

const mockSetPermissions = jest.fn();

jest.mock('@open-kingdom/shared-frontend-data-access-api-client', () => ({
  usePermissionsControllerFindAllQuery: () => ({
    data: [
      { id: 1, resource: 'users', action: 'read', description: 'View users' },
      {
        id: 2,
        resource: 'users',
        action: 'delete',
        description: 'Delete users',
      },
      {
        id: 3,
        resource: 'roles',
        action: 'read',
        description: 'View roles',
      },
    ],
  }),
  useRolesControllerGetPermissionsQuery: () => ({
    data: [
      { id: 1, resource: 'users', action: 'read', description: 'View users' },
    ],
  }),
  useRolesControllerSetPermissionsMutation: () => [
    mockSetPermissions,
    { isLoading: false },
  ],
}));

jest.mock('@open-kingdom/shared-frontend-data-access-notifications', () => ({
  showSuccessNotification: jest.fn((msg: string) => ({
    type: 'notify',
    payload: msg,
  })),
}));

jest.mock('@open-kingdom/shared-frontend-ui-primitives', () => ({
  __esModule: true,
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div data-testid="modal">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogDescription: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Button: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    children: React.ReactNode;
  }) => <button {...props}>{children}</button>,
}));

const store = configureStore({ reducer: {} });

function renderWithProviders(ui: React.ReactElement) {
  return render(<Provider store={store}>{ui}</Provider>);
}

describe('RolePermissionsModal', () => {
  beforeEach(() => {
    mockSetPermissions.mockReset();
    mockSetPermissions.mockReturnValue({
      unwrap: () => Promise.resolve(),
    });
  });

  it('does not render when closed', () => {
    renderWithProviders(
      <RolePermissionsModal
        isOpen={false}
        onClose={jest.fn()}
        role={{ id: 1, name: 'admin' }}
      />
    );
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('shows the role name in the heading', () => {
    renderWithProviders(
      <RolePermissionsModal
        isOpen={true}
        onClose={jest.fn()}
        role={{ id: 1, name: 'admin' }}
      />
    );
    expect(screen.getByText('admin')).toBeInTheDocument();
  });

  it('groups permissions by resource', () => {
    renderWithProviders(
      <RolePermissionsModal
        isOpen={true}
        onClose={jest.fn()}
        role={{ id: 1, name: 'admin' }}
      />
    );
    expect(screen.getByText('users')).toBeInTheDocument();
    expect(screen.getByText('roles')).toBeInTheDocument();
  });

  it('pre-checks permissions already assigned to the role', () => {
    renderWithProviders(
      <RolePermissionsModal
        isOpen={true}
        onClose={jest.fn()}
        role={{ id: 1, name: 'admin' }}
      />
    );
    const checkboxes = screen.getAllByRole('checkbox');
    // First permission (users:read) is assigned
    expect(checkboxes[0]).toBeChecked();
    // Second permission (users:delete) is not assigned
    expect(checkboxes[1]).not.toBeChecked();
  });

  it('saves the selected permissions', async () => {
    const onClose = jest.fn();
    renderWithProviders(
      <RolePermissionsModal
        isOpen={true}
        onClose={onClose}
        role={{ id: 1, name: 'admin' }}
      />
    );

    // Toggle on users:delete (checkbox index 1)
    fireEvent.click(screen.getAllByRole('checkbox')[1]);

    fireEvent.click(screen.getByTestId('permissions-save-btn'));

    await waitFor(() => {
      expect(mockSetPermissions).toHaveBeenCalledWith({
        id: 1,
        setRolePermissionsDto: {
          permissionIds: expect.arrayContaining([1, 2]),
        },
      });
    });
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('closes without saving when cancelled', () => {
    const onClose = jest.fn();
    renderWithProviders(
      <RolePermissionsModal
        isOpen={true}
        onClose={onClose}
        role={{ id: 1, name: 'admin' }}
      />
    );

    fireEvent.click(screen.getByTestId('permissions-cancel-btn'));
    expect(onClose).toHaveBeenCalled();
    expect(mockSetPermissions).not.toHaveBeenCalled();
  });

  it('does not crash when saving permissions fails', async () => {
    mockSetPermissions.mockReturnValue({
      unwrap: () => Promise.reject(new Error('Server error')),
    });
    const onClose = jest.fn();
    renderWithProviders(
      <RolePermissionsModal
        isOpen={true}
        onClose={onClose}
        role={{ id: 1, name: 'admin' }}
      />
    );

    fireEvent.click(screen.getByTestId('permissions-save-btn'));

    await waitFor(() => {
      expect(mockSetPermissions).toHaveBeenCalled();
    });
    expect(onClose).not.toHaveBeenCalled();
  });
});
