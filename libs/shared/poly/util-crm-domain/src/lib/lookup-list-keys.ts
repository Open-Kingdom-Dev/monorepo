export const LOOKUP_LIST_KEYS = {
  LEAD_STATUS: 'lead_status',
  LEAD_SOURCE: 'lead_source',
  OPPORTUNITY_STAGE: 'opportunity_stage',
  ACTIVITY_TYPE: 'activity_type',
  CONTACT_STATUS: 'contact_status',
  COMPANY_STATUS: 'company_status',
  INDUSTRY: 'industry',
  LOSS_REASON: 'loss_reason',
} as const;

export type LookupListKey = (typeof LOOKUP_LIST_KEYS)[keyof typeof LOOKUP_LIST_KEYS];

export const ALL_LOOKUP_LIST_KEYS: readonly LookupListKey[] = Object.values(LOOKUP_LIST_KEYS);
