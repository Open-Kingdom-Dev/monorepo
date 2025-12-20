import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CreateRoleForm } from './CreateRoleForm.component';

jest.mock('../../../components/InviteUserModal.component', () => ({
  InviteUserModal: () => null,
}));

jest.mock('@hookform/resolvers/zod', () => ({
  zodResolver: () => () => ({ values: {}, errors: {} }),
}));

describe('Create Role Form', () => {
  it('allows user to enter role name and description', () => {
    render(<CreateRoleForm onSubmit={jest.fn()} />);

    expect(screen.getByLabelText('Role Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
  });

  it('shows Create button for submitting', () => {
    render(<CreateRoleForm onSubmit={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
  });

  it('disables button and shows creating status while saving', () => {
    render(<CreateRoleForm onSubmit={jest.fn()} isLoading />);

    const button = screen.getByRole('button', { name: 'Creating...' });
    expect(button).toBeDisabled();
  });

  it('submits role details when form is completed', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);

    render(<CreateRoleForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('Role Name'), {
      target: { value: 'Manager' },
    });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Can manage team members' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });
  });
});
