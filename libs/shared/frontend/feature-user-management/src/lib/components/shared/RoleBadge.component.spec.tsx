import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RoleBadge } from './RoleBadge.component';

describe('RoleBadge', () => {
  it('displays the capitalised role name', () => {
    render(<RoleBadge role="admin" />);
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('uses secondary styles for admin', () => {
    const { container } = render(<RoleBadge role="admin" />);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-secondary-100');
    expect(badge).toHaveClass('text-secondary-800');
  });

  it('uses primary styles for user', () => {
    const { container } = render(<RoleBadge role="user" />);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-primary-100');
    expect(badge).toHaveClass('text-primary-800');
  });

  it('uses neutral styles for guest', () => {
    const { container } = render(<RoleBadge role="guest" />);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-neutral-100');
    expect(badge).toHaveClass('text-neutral-700');
  });

  it('falls back to primary styles for dynamic roles', () => {
    const { container } = render(<RoleBadge role="moderator" />);
    expect(screen.getByText('Moderator')).toBeInTheDocument();
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-primary-100');
    expect(badge).toHaveClass('text-primary-800');
  });

  it('renders nothing when role is null', () => {
    const { container } = render(<RoleBadge role={null} />);
    expect(container.innerHTML).toBe('');
  });

  it('displays a custom role with a capitalized label', () => {
    render(<RoleBadge role="editor" />);
    expect(screen.getByText('Editor')).toBeInTheDocument();
  });
});
