import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UserManagementPage } from './UserManagement.page';

jest.mock('./tabs', () => ({
  UsersTab: () => <div data-testid="users-tab">Users Tab Content</div>,
  RolesTab: () => <div data-testid="roles-tab">Roles Tab Content</div>,
}));

describe('UserManagementPage', () => {
  const createMockApi = () => ({
    injectEndpoints: jest.fn().mockReturnThis(),
  });

  it('renders page title', () => {
    render(<UserManagementPage api={createMockApi() as never} />);
    expect(screen.getByText('User Management')).toBeTruthy();
  });

  it('shows users tab by default', () => {
    render(<UserManagementPage api={createMockApi() as never} />);
    expect(screen.getByTestId('users-tab')).toBeTruthy();
  });

  it('navigates to roles tab', () => {
    render(<UserManagementPage api={createMockApi() as never} />);

    fireEvent.click(screen.getByRole('button', { name: 'Roles' }));

    expect(screen.getByTestId('roles-tab')).toBeTruthy();
    expect(screen.queryByTestId('users-tab')).toBeNull();
  });

  it('navigates back to users tab', () => {
    render(<UserManagementPage api={createMockApi() as never} />);

    fireEvent.click(screen.getByRole('button', { name: 'Roles' }));
    fireEvent.click(screen.getByRole('button', { name: 'Users' }));

    expect(screen.getByTestId('users-tab')).toBeTruthy();
  });

  it('accepts custom class name prop', () => {
    // Just verify the component renders with className prop without error
    render(
      <UserManagementPage
        api={createMockApi() as never}
        className="custom-class"
      />
    );

    expect(screen.getByText('User Management')).toBeTruthy();
  });
});
