import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StatusBadge } from './StatusBadge.component';

describe('StatusBadge', () => {
  it('capitalizes "pending" to "Pending"', () => {
    render(<StatusBadge status="pending" />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.queryByText('pending')).not.toBeInTheDocument();
  });

  it('capitalizes "accepted" to "Accepted"', () => {
    render(<StatusBadge status="accepted" />);
    expect(screen.getByText('Accepted')).toBeInTheDocument();
    expect(screen.queryByText('accepted')).not.toBeInTheDocument();
  });

  it('capitalizes "expired" to "Expired"', () => {
    render(<StatusBadge status="expired" />);
    expect(screen.getByText('Expired')).toBeInTheDocument();
    expect(screen.queryByText('expired')).not.toBeInTheDocument();
  });

  it('applies warning styles for pending status', () => {
    const { container } = render(<StatusBadge status="pending" />);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-warning-100');
    expect(badge).toHaveClass('text-warning-800');
  });

  it('applies success styles for accepted status', () => {
    const { container } = render(<StatusBadge status="accepted" />);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-success-100');
    expect(badge).toHaveClass('text-success-800');
  });

  it('applies neutral styles for expired status', () => {
    const { container } = render(<StatusBadge status="expired" />);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-neutral-100');
    expect(badge).toHaveClass('text-neutral-700');
  });

  it('renders nothing when status is empty', () => {
    const { container } = render(<StatusBadge status={'' as never} />);
    expect(container.innerHTML).toBe('');
  });
});
