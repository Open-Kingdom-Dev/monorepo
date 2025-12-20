import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RoleBadge } from './RoleBadge.component';
import { styles } from '../styles';

describe('RoleBadge', () => {
  it('shows admin badge for administrators', () => {
    render(<RoleBadge userRole="admin" />);

    const badge = screen.getByText('admin');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass(styles.badgeAdmin);
  });

  it('shows user badge for regular users', () => {
    render(<RoleBadge userRole="user" />);

    const badge = screen.getByText('user');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass(styles.badgeUser);
  });

  it('shows guest badge for unrecognized roles', () => {
    render(<RoleBadge userRole="unknown" />);

    const badge = screen.getByText('guest');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass(styles.badgeGuest);
  });

  it('shows pending badge when user has not yet accepted invitation', () => {
    render(<RoleBadge userRole="admin" isPending={true} />);

    const badge = screen.getByText('Pending');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass(styles.badgePending);
  });

  it('shows role badge when invitation has been accepted', () => {
    render(<RoleBadge userRole="admin" isPending={false} />);

    const badge = screen.getByText('admin');
    expect(badge).toBeInTheDocument();
  });
});
