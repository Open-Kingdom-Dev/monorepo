import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ConfirmDialog } from './ConfirmDialog.component';

jest.mock('@open-kingdom/shared-frontend-ui-primitives', () => ({
  AlertDialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div data-testid="alert-dialog">{children}</div> : null,
  AlertDialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: { children: React.ReactNode }) => <h3>{children}</h3>,
  AlertDialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  AlertDialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogCancel: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
  AlertDialogAction: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));

describe('ConfirmDialog', () => {
  const defaultProps = {
    isOpen: true,
    title: 'Delete User',
    message: 'Are you sure?',
    confirmLabel: 'Delete',
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
  };

  it('shows the confirmation message when opened', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText('Delete User')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('hides the dialog when closed', () => {
    render(<ConfirmDialog {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Delete User')).not.toBeInTheDocument();
  });

  it('proceeds with the action when confirmed', () => {
    const onConfirm = jest.fn();
    render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByText('Delete'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('cancels when clicking Cancel', () => {
    const onCancel = jest.fn();
    render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('prevents interaction while the action is in progress', () => {
    render(<ConfirmDialog {...defaultProps} isLoading={true} />);
    expect(screen.getByText('Delete')).toBeDisabled();
    expect(screen.getByText('Cancel')).toBeDisabled();
  });
});
