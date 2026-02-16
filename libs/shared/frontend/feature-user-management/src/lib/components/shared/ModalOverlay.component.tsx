import { useCallback } from 'react';
import { useKeyboardEvent } from '@react-hookz/web';

interface ModalOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  ariaLabelledBy: string;
  children: React.ReactNode;
}

export function ModalOverlay({
  isOpen,
  onClose,
  ariaLabelledBy,
  children,
}: ModalOverlayProps) {
  useKeyboardEvent('Escape', () => {
    if (isOpen) onClose();
  });

  const dialogRef = useCallback((node: HTMLDivElement | null) => {
    node?.focus();
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-neutral-800"
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
