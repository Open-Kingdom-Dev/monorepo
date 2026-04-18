import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StatusBadge } from './StatusBadge.component';

jest.mock('@open-kingdom/shared-frontend-ui-primitives', () => ({
  Badge: ({ children, variant, ...props }: { children: React.ReactNode; variant?: string; [key: string]: unknown }) => (
    <span data-variant={variant} {...props}>{children}</span>
  ),
}));

describe('StatusBadge', () => {
  it('capitalizes "pending" to "Pending"', () => {
    render(<StatusBadge status="pending" />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('capitalizes "accepted" to "Accepted"', () => {
    render(<StatusBadge status="accepted" />);
    expect(screen.getByText('Accepted')).toBeInTheDocument();
  });

  it('capitalizes "expired" to "Expired"', () => {
    render(<StatusBadge status="expired" />);
    expect(screen.getByText('Expired')).toBeInTheDocument();
  });

  it('applies warning variant for pending status', () => {
    render(<StatusBadge status="pending" />);
    expect(screen.getByText('Pending')).toHaveAttribute('data-variant', 'warning');
  });

  it('applies success variant for accepted status', () => {
    render(<StatusBadge status="accepted" />);
    expect(screen.getByText('Accepted')).toHaveAttribute('data-variant', 'success');
  });

  it('applies muted variant for expired status', () => {
    render(<StatusBadge status="expired" />);
    expect(screen.getByText('Expired')).toHaveAttribute('data-variant', 'muted');
  });

  it('renders nothing when status is empty', () => {
    const { container } = render(<StatusBadge status={'' as never} />);
    expect(container.innerHTML).toBe('');
  });
});
