import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { InviteUserModal } from './InviteUserModal.component';

const mockInvite = jest.fn();

jest.mock('@open-kingdom/shared-frontend-data-access-api-client', () => ({
  useInvitationsControllerInviteMutation: () => [
    mockInvite,
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

describe('InviteUserModal', () => {
  beforeEach(() => {
    mockInvite.mockReset();
    mockInvite.mockReturnValue({ unwrap: () => Promise.resolve() });
  });

  it('shows the invitation form when opened', () => {
    renderWithProviders(<InviteUserModal isOpen={true} onClose={jest.fn()} />);
    expect(screen.getByText('Invite User')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
  });

  it('hides the form when closed', () => {
    renderWithProviders(<InviteUserModal isOpen={false} onClose={jest.fn()} />);
    expect(screen.queryByText('Invite User')).not.toBeInTheDocument();
  });

  it('sends the invitation with the entered email and role', async () => {
    const onClose = jest.fn();
    renderWithProviders(<InviteUserModal isOpen={true} onClose={onClose} />);
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.click(screen.getByText('Send Invitation'));
    await waitFor(() => {
      expect(mockInvite).toHaveBeenCalledWith({
        inviteUserDto: { email: 'user@example.com', role: 'guest' },
      });
    });
  });

  it('closes after sending the invitation', async () => {
    const onClose = jest.fn();
    renderWithProviders(<InviteUserModal isOpen={true} onClose={onClose} />);
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.click(screen.getByText('Send Invitation'));
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('closes when clicking Cancel', () => {
    const onClose = jest.fn();
    renderWithProviders(<InviteUserModal isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });
});
