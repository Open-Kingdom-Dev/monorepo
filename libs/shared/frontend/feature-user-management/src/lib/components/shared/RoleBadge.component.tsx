import { Badge } from '@open-kingdom/shared-frontend-ui-primitives';

const variantMap: Record<string, 'secondary' | 'default' | 'muted'> = {
  admin: 'secondary',
  user: 'default',
  guest: 'muted',
};

interface RoleBadgeProps {
  role: string | null;
}

export function RoleBadge({ role }: RoleBadgeProps) {
  if (!role) return null;
  const label = role.charAt(0).toUpperCase() + role.slice(1);
  return <Badge variant={variantMap[role] ?? 'default'}>{label}</Badge>;
}
