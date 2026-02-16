import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RoleBadge } from './RoleBadge.component';

describe('RoleBadge', () => {
  it('displays "Admin" for admin users', () => {
    render(<RoleBadge role="admin" />);
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('displays "User" for regular users', () => {
    render(<RoleBadge role="user" />);
    expect(screen.getByText('User')).toBeInTheDocument();
  });

  it('displays "Guest" for guest users', () => {
    render(<RoleBadge role="guest" />);
    expect(screen.getByText('Guest')).toBeInTheDocument();
  });
});
