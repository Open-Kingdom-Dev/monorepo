import type { InvitationStatus } from '../../types';

const statusStyles: Record<InvitationStatus, string> = {
  pending:
    'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-300',
  accepted:
    'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-300',
  expired:
    'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300',
};

interface StatusBadgeProps {
  status: InvitationStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  if (!status) return null;
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[status]}`}
    >
      {label}
    </span>
  );
}
