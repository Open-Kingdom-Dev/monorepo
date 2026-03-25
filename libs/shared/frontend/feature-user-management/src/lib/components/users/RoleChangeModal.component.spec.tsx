import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { RoleChangeModal } from './RoleChangeModal.component';

const mockSetRoles = jest.fn();
const mockRolesQuery = jest.fn();

jest.mock('@open-kingdom/shared-frontend-data-access-api-client', () => ({
  useRolesControllerFindAllQuery: () => mockRolesQuery(),
  useUserRolesControllerSetRolesMutation: () => [
    mockSetRoles,
    { isLoading: false },
  ],
}));

jest.mock('@open-kingdom/shared-frontend-data-access-notifications', () => ({
  showSuccessNotification: jest.fn((msg: string) => ({
    type: 'notify',
    payload: msg,
  })),
}));

const store = configureStore({ reducer: {} });

function renderWithProviders(ui: React.ReactElement) {
  return render(<Provider store={store}>{ui}</Provider>);
}

const mockRoles = [
  { id: 1, name: 'admin' },
  { id: 2, name: 'user' },
  { id: 3, name: 'guest' },
];

const mockUser = { id: 5, email: 'test@example.com', role: 'user' };

describe('RoleChangeModal', () => {
  beforeEach(() => {
    mockSetRoles.mockReset();
    mockSetRoles.mockReturnValue({ unwrap: () => Promise.resolve() });
    mockRolesQuery.mockReturnValue({ data: mockRoles });
  });

  it('shows available roles when opened', () => {
    renderWithProviders(
      <RoleChangeModal isOpen={true} onClose={jest.fn()} user={mockUser} />
    );

    expect(screen.getByText('Change Role')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('User')).toBeInTheDocument();
    expect(screen.getByText('Guest')).toBeInTheDocument();
  });

  it('saves the selected role when confirmed', async () => {
    const onClose = jest.fn();
    renderWithProviders(
      <RoleChangeModal isOpen={true} onClose={onClose} user={mockUser} />
    );

    fireEvent.change(screen.getByTestId('role-select'), {
      target: { value: '1' },
    });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(mockSetRoles).toHaveBeenCalledWith({
        userId: 5,
        updateUserRolesDto: { roleIds: [1] },
      });
    });
  });

  it('closes after a successful role change', async () => {
    const onClose = jest.fn();
    renderWithProviders(
      <RoleChangeModal isOpen={true} onClose={onClose} user={mockUser} />
    );

    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('closes when clicking Cancel', () => {
    const onClose = jest.fn();
    renderWithProviders(
      <RoleChangeModal isOpen={true} onClose={onClose} user={mockUser} />
    );

    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  it('does not crash when the role change fails', async () => {
    mockSetRoles.mockReturnValue({
      unwrap: () => Promise.reject(new Error('Server error')),
    });
    const onClose = jest.fn();
    renderWithProviders(
      <RoleChangeModal isOpen={true} onClose={onClose} user={mockUser} />
    );

    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(mockSetRoles).toHaveBeenCalled();
    });
    expect(onClose).not.toHaveBeenCalled();
  });
});
