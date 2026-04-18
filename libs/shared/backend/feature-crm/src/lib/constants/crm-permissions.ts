export const CRM_RESOURCES = [
  'contacts',
  'companies',
  'leads',
  'opportunities',
  'activities',
  'lookups',
] as const;

export type CrmResource = (typeof CRM_RESOURCES)[number];

export const CRM_ACTIONS = ['read', 'create', 'update', 'delete'] as const;

/**
 * Permission mapping for the CRM domain.
 * - admin gets full CRUD on every CRM resource plus lookup config.
 * - user (sales) gets read/create/update on records, no delete.
 * - manager gets read-only across everything (oversight).
 */
export const CRM_ROLE_PERMISSIONS: Record<
  string,
  ReadonlyArray<{ resource: CrmResource; action: (typeof CRM_ACTIONS)[number] }>
> = {
  admin: CRM_RESOURCES.flatMap((resource) =>
    CRM_ACTIONS.map((action) => ({ resource, action }))
  ),
  user: [
    ...CRM_RESOURCES.filter((r) => r !== 'lookups').flatMap((resource) => [
      { resource, action: 'read' as const },
      { resource, action: 'create' as const },
      { resource, action: 'update' as const },
    ]),
    { resource: 'lookups', action: 'read' },
  ],
  manager: CRM_RESOURCES.map((resource) => ({ resource, action: 'read' as const })),
};
