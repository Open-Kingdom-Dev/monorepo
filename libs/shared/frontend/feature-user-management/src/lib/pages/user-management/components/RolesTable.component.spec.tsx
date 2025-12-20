import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RolesTable } from './RolesTable.component';
import type { CustomRole } from '../../../types/user-management.types';

describe('RolesTable', () => {
  const mockRoles: CustomRole[] = [
    {
      id: 1,
      name: 'Manager',
      description: 'Can manage team members',
      permissions: null,
      createdAt: 1704067200,
      createdBy: 1,
    },
    {
      id: 2,
      name: 'Editor',
      description: 'Can edit content',
      permissions: null,
      createdAt: 1704067200,
      createdBy: 1,
    },
    {
      id: 3,
      name: 'Viewer',
      description: null,
      permissions: null,
      createdAt: 1704067200,
      createdBy: 1,
    },
  ];

  it('shows all roles in the table', () => {
    render(<RolesTable roles={mockRoles} onDelete={jest.fn()} />);

    expect(screen.getByText('Manager')).toBeInTheDocument();
    expect(screen.getByText('Editor')).toBeInTheDocument();
    expect(screen.getByText('Viewer')).toBeInTheDocument();
  });

  it('displays role descriptions when available', () => {
    render(<RolesTable roles={mockRoles} onDelete={jest.fn()} />);

    expect(screen.getByText('Can manage team members')).toBeInTheDocument();
    expect(screen.getByText('Can edit content')).toBeInTheDocument();
  });

  it('shows placeholder when description is not provided', () => {
    render(<RolesTable roles={mockRoles} onDelete={jest.fn()} />);

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('triggers delete when delete button is clicked', () => {
    const onDelete = jest.fn();

    render(<RolesTable roles={mockRoles} onDelete={onDelete} />);

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    fireEvent.click(deleteButtons[0]);

    expect(onDelete).toHaveBeenCalledWith(1);
  });
});
