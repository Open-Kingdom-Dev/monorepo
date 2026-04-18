export const SYSTEM_ROLES = {
  GUEST: 'guest',
  USER: 'user',
  MANAGER: 'manager',
  ADMIN: 'admin',
} as const;

export const DEFAULT_ROLES = [
  {
    name: SYSTEM_ROLES.GUEST,
    isSystem: 1,
    description: 'Default role for unauthenticated or limited-access users',
  },
  {
    name: SYSTEM_ROLES.USER,
    isSystem: 1,
    description: 'Standard authenticated user',
  },
  {
    name: SYSTEM_ROLES.MANAGER,
    isSystem: 1,
    description:
      'Oversight role — read-only visibility across team records, dashboards, and activity',
  },
  {
    name: SYSTEM_ROLES.ADMIN,
    isSystem: 1,
    description: 'Full system administrator',
  },
] as const;

export const DEFAULT_PERMISSIONS = [
  { resource: 'users', action: 'read', description: 'View user profiles' },
  { resource: 'users', action: 'create', description: 'Create new users' },
  { resource: 'users', action: 'update', description: 'Update user profiles' },
  { resource: 'users', action: 'delete', description: 'Delete users' },
  { resource: 'roles', action: 'read', description: 'View roles' },
  { resource: 'roles', action: 'create', description: 'Create roles' },
  { resource: 'roles', action: 'update', description: 'Update roles' },
  { resource: 'roles', action: 'delete', description: 'Delete roles' },
  {
    resource: 'invitations',
    action: 'read',
    description: 'View invitations',
  },
  {
    resource: 'invitations',
    action: 'create',
    description: 'Send invitations',
  },
  {
    resource: 'invitations',
    action: 'delete',
    description: 'Cancel invitations',
  },
  {
    resource: 'permissions',
    action: 'read',
    description: 'View permissions',
  },
  {
    resource: 'permissions',
    action: 'create',
    description: 'Create permissions',
  },
  {
    resource: 'permissions',
    action: 'delete',
    description: 'Delete permissions',
  },
  { resource: 'profile', action: 'read', description: 'View own profile' },
] as const;

export const DEFAULT_ROLE_PERMISSIONS: Record<
  string,
  ReadonlyArray<{ resource: string; action: string }>
> = {
  [SYSTEM_ROLES.GUEST]: [{ resource: 'profile', action: 'read' }],
  [SYSTEM_ROLES.USER]: [
    { resource: 'users', action: 'read' },
    { resource: 'roles', action: 'read' },
    { resource: 'invitations', action: 'read' },
    { resource: 'profile', action: 'read' },
  ],
  [SYSTEM_ROLES.MANAGER]: [
    { resource: 'users', action: 'read' },
    { resource: 'roles', action: 'read' },
    { resource: 'invitations', action: 'read' },
    { resource: 'profile', action: 'read' },
  ],
  [SYSTEM_ROLES.ADMIN]: [
    { resource: 'users', action: 'read' },
    { resource: 'users', action: 'create' },
    { resource: 'users', action: 'update' },
    { resource: 'users', action: 'delete' },
    { resource: 'roles', action: 'read' },
    { resource: 'roles', action: 'create' },
    { resource: 'roles', action: 'update' },
    { resource: 'roles', action: 'delete' },
    { resource: 'permissions', action: 'read' },
    { resource: 'permissions', action: 'create' },
    { resource: 'permissions', action: 'delete' },
    { resource: 'invitations', action: 'read' },
    { resource: 'invitations', action: 'create' },
    { resource: 'invitations', action: 'delete' },
    { resource: 'profile', action: 'read' },
  ],
};
