import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RoleBadge } from './RoleBadge.component';

jest.mock('@open-kingdom/shared-frontend-ui-primitives', () => ({
  Badge: ({
    children,
    variant,
    ...props
  }: {
    children: React.ReactNode;
    variant?: string;
    [key: string]: unknown;
  }) => (
    <span data-variant={variant} {...props}>
      {children}
    </span>
  ),
}));

describe('RoleBadge', () => {
  it('displays the capitalised role name', () => {
    render(<RoleBadge role="admin" />);
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('uses secondary variant for admin', () => {
    render(<RoleBadge role="admin" />);
    expect(screen.getByText('Admin')).toHaveAttribute(
      'data-variant',
      'secondary'
    );
  });

  it('uses default variant for user', () => {
    render(<RoleBadge role="user" />);
    expect(screen.getByText('User')).toHaveAttribute('data-variant', 'default');
  });

  it('uses muted variant for guest', () => {
    render(<RoleBadge role="guest" />);
    expect(screen.getByText('Guest')).toHaveAttribute('data-variant', 'muted');
  });

  it('falls back to default variant for dynamic roles', () => {
    render(<RoleBadge role="moderator" />);
    expect(screen.getByText('Moderator')).toHaveAttribute(
      'data-variant',
      'default'
    );
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
