import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ModalOverlay } from './ModalOverlay.component';

describe('ModalOverlay', () => {
  it('shows the content when opened', () => {
    render(
      <ModalOverlay
        isOpen={true}
        onClose={jest.fn()}
        ariaLabelledBy="test-title"
      >
        <p>Modal Content</p>
      </ModalOverlay>
    );
    expect(screen.getByText('Modal Content')).toBeInTheDocument();
  });

  it('hides the content when closed', () => {
    render(
      <ModalOverlay
        isOpen={false}
        onClose={jest.fn()}
        ariaLabelledBy="test-title"
      >
        <p>Modal Content</p>
      </ModalOverlay>
    );
    expect(screen.queryByText('Modal Content')).not.toBeInTheDocument();
  });

  it('is announced as a dialog for screen readers', () => {
    render(
      <ModalOverlay
        isOpen={true}
        onClose={jest.fn()}
        ariaLabelledBy="test-title"
      >
        <p>Content</p>
      </ModalOverlay>
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'test-title');
  });

  it('closes when pressing Escape', () => {
    const onClose = jest.fn();
    render(
      <ModalOverlay isOpen={true} onClose={onClose} ariaLabelledBy="test-title">
        <p>Content</p>
      </ModalOverlay>
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('closes when clicking outside', () => {
    const onClose = jest.fn();
    render(
      <ModalOverlay isOpen={true} onClose={onClose} ariaLabelledBy="test-title">
        <p>Content</p>
      </ModalOverlay>
    );
    const backdrop = screen.getByRole('dialog').parentElement;
    expect(backdrop).toBeTruthy();
    fireEvent.click(backdrop as HTMLElement);
    expect(onClose).toHaveBeenCalled();
  });

  it('stays open when clicking inside', () => {
    const onClose = jest.fn();
    render(
      <ModalOverlay isOpen={true} onClose={onClose} ariaLabelledBy="test-title">
        <p>Content</p>
      </ModalOverlay>
    );
    fireEvent.click(screen.getByText('Content'));
    expect(onClose).not.toHaveBeenCalled();
  });
});
