import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UsersTable } from './UsersTable.component';
import type { User } from '../../../types';

jest.mock('../../../components/InviteUserModal.component', () => ({
  InviteUserModal: () => null,
}));

describe('UsersTable', () => {
  const mockUsers: User[] = [
    {
      id: 1,
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      customRoleId: null,
    },
    {
      id: 2,
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'user',
      customRoleId: null,
    },
    {
      id: 3,
      email: 'pending@example.com',
      firstName: 'Pending',
      lastName: 'User',
      role: 'user',
      customRoleId: null,
      isPending: true,
    },
  ];

  it('shows all users in the table', () => {
    render(<UsersTable users={mockUsers} onDelete={jest.fn()} />);

    expect(screen.getByText('admin@example.com')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('pending@example.com')).toBeInTheDocument();
  });

  it('displays user full name when available', () => {
    render(<UsersTable users={mockUsers} onDelete={jest.fn()} />);

    expect(screen.getByText('Admin User')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('shows role badge for each user', () => {
    render(<UsersTable users={mockUsers} onDelete={jest.fn()} />);

    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getAllByText('user')).toHaveLength(1);
  });

  it('shows pending badge for users awaiting invitation acceptance', () => {
    render(<UsersTable users={mockUsers} onDelete={jest.fn()} />);

    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('triggers delete when delete button is clicked', () => {
    const onDelete = jest.fn();

    render(<UsersTable users={mockUsers} onDelete={onDelete} />);

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    fireEvent.click(deleteButtons[0]);

    expect(onDelete).toHaveBeenCalledWith(1);
  });
});
