import { ModalOverlay } from './ModalOverlay.component';
import { buttonSecondaryStyles, buttonDangerStyles } from '../../styles';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmDialogProps) {
  const titleId = 'confirm-dialog-title';

  return (
    <ModalOverlay isOpen={isOpen} onClose={onCancel} ariaLabelledBy={titleId}>
      <h3
        id={titleId}
        className="text-lg font-semibold text-neutral-900 dark:text-neutral-100"
      >
        {title}
      </h3>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
        {message}
      </p>
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          data-testid="confirm-cancel-btn"
          onClick={onCancel}
          disabled={isLoading}
          className={buttonSecondaryStyles}
        >
          Cancel
        </button>
        <button
          type="button"
          data-testid="confirm-btn"
          onClick={onConfirm}
          disabled={isLoading}
          className={buttonDangerStyles}
        >
          {confirmLabel}
        </button>
      </div>
    </ModalOverlay>
  );
}
