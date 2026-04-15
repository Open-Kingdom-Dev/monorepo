const systemRoleStyles: Record<string, string> = {
  admin:
    'bg-secondary-100 text-secondary-800 dark:bg-secondary-900/30 dark:text-secondary-300',
  user: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300',
  guest:
    'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300',
};

const fallbackStyle =
  'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300';

interface RoleBadgeProps {
  role: string | null;
}

export function RoleBadge({ role }: RoleBadgeProps) {
  if (!role) return null;
  const label = role.charAt(0).toUpperCase() + role.slice(1);
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
        systemRoleStyles[role] ?? fallbackStyle
      }`}
    >
      {label}
    </span>
  );
}
