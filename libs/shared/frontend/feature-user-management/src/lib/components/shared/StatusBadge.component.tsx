import { Badge } from '@open-kingdom/shared-frontend-ui-primitives';
import type { InvitationStatus } from '../../types';

const variantMap: Record<InvitationStatus, 'warning' | 'success' | 'muted'> = {
  pending: 'warning',
  accepted: 'success',
  expired: 'muted',
};

interface StatusBadgeProps {
  status: InvitationStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  if (!status) return null;
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return <Badge variant={variantMap[status]}>{label}</Badge>;
}
