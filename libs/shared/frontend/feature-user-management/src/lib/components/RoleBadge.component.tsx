import { styles } from '../styles';

interface RoleBadgeProps {
  userRole: string;
  isPending?: boolean;
}

interface BadgeConfig {
  style: string;
  label: string;
}

const badgeConfigs = new Map<string, BadgeConfig>([
  ['admin', { style: styles.badgeAdmin, label: 'admin' }],
  ['user', { style: styles.badgeUser, label: 'user' }],
]);

const pendingConfig: BadgeConfig = {
  style: styles.badgePending,
  label: 'Pending',
};
const defaultConfig: BadgeConfig = { style: styles.badgeGuest, label: 'guest' };

function getBadgeConfig(role: string, isPending?: boolean): BadgeConfig {
  if (isPending) {
    return pendingConfig;
  }
  return badgeConfigs.get(role) ?? defaultConfig;
}

export function RoleBadge({ userRole, isPending }: RoleBadgeProps) {
  const config = getBadgeConfig(userRole, isPending);
  return <span className={config.style}>{config.label}</span>;
}
