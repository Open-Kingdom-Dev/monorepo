import { LOOKUP_LIST_KEYS } from '@open-kingdom/crm-poly-util-domain';

export interface DefaultLookupEntry {
  listKey: string;
  value: string;
  label: string;
  sortOrder: number;
}

export const DEFAULT_CRM_LOOKUPS: ReadonlyArray<DefaultLookupEntry> = [
  // Lead statuses (canonical + terminal)
  { listKey: LOOKUP_LIST_KEYS.LEAD_STATUS, value: 'new', label: 'New', sortOrder: 10 },
  { listKey: LOOKUP_LIST_KEYS.LEAD_STATUS, value: 'contacted', label: 'Contacted', sortOrder: 20 },
  { listKey: LOOKUP_LIST_KEYS.LEAD_STATUS, value: 'qualified', label: 'Qualified', sortOrder: 30 },
  { listKey: LOOKUP_LIST_KEYS.LEAD_STATUS, value: 'unqualified', label: 'Unqualified', sortOrder: 40 },

  // Lead sources (starter set)
  { listKey: LOOKUP_LIST_KEYS.LEAD_SOURCE, value: 'website', label: 'Website', sortOrder: 10 },
  { listKey: LOOKUP_LIST_KEYS.LEAD_SOURCE, value: 'referral', label: 'Referral', sortOrder: 20 },
  { listKey: LOOKUP_LIST_KEYS.LEAD_SOURCE, value: 'cold_outreach', label: 'Cold outreach', sortOrder: 30 },
  { listKey: LOOKUP_LIST_KEYS.LEAD_SOURCE, value: 'event', label: 'Event', sortOrder: 40 },
  { listKey: LOOKUP_LIST_KEYS.LEAD_SOURCE, value: 'other', label: 'Other', sortOrder: 50 },

  // Opportunity stages
  { listKey: LOOKUP_LIST_KEYS.OPPORTUNITY_STAGE, value: 'new', label: 'New', sortOrder: 10 },
  { listKey: LOOKUP_LIST_KEYS.OPPORTUNITY_STAGE, value: 'discovery', label: 'Discovery', sortOrder: 20 },
  { listKey: LOOKUP_LIST_KEYS.OPPORTUNITY_STAGE, value: 'proposal', label: 'Proposal', sortOrder: 30 },
  { listKey: LOOKUP_LIST_KEYS.OPPORTUNITY_STAGE, value: 'negotiation', label: 'Negotiation', sortOrder: 40 },
  { listKey: LOOKUP_LIST_KEYS.OPPORTUNITY_STAGE, value: 'won', label: 'Won', sortOrder: 50 },
  { listKey: LOOKUP_LIST_KEYS.OPPORTUNITY_STAGE, value: 'lost', label: 'Lost', sortOrder: 60 },

  // Activity types (mirrors the ActivityType enum)
  { listKey: LOOKUP_LIST_KEYS.ACTIVITY_TYPE, value: 'note', label: 'Note', sortOrder: 10 },
  { listKey: LOOKUP_LIST_KEYS.ACTIVITY_TYPE, value: 'call', label: 'Call', sortOrder: 20 },
  { listKey: LOOKUP_LIST_KEYS.ACTIVITY_TYPE, value: 'meeting', label: 'Meeting', sortOrder: 30 },
  { listKey: LOOKUP_LIST_KEYS.ACTIVITY_TYPE, value: 'email', label: 'Email', sortOrder: 40 },
  { listKey: LOOKUP_LIST_KEYS.ACTIVITY_TYPE, value: 'task', label: 'Task', sortOrder: 50 },

  // Contact and company statuses
  { listKey: LOOKUP_LIST_KEYS.CONTACT_STATUS, value: 'active', label: 'Active', sortOrder: 10 },
  { listKey: LOOKUP_LIST_KEYS.CONTACT_STATUS, value: 'inactive', label: 'Inactive', sortOrder: 20 },
  { listKey: LOOKUP_LIST_KEYS.COMPANY_STATUS, value: 'active', label: 'Active', sortOrder: 10 },
  { listKey: LOOKUP_LIST_KEYS.COMPANY_STATUS, value: 'inactive', label: 'Inactive', sortOrder: 20 },
  { listKey: LOOKUP_LIST_KEYS.COMPANY_STATUS, value: 'prospect', label: 'Prospect', sortOrder: 30 },
  { listKey: LOOKUP_LIST_KEYS.COMPANY_STATUS, value: 'customer', label: 'Customer', sortOrder: 40 },

  // Loss reasons
  { listKey: LOOKUP_LIST_KEYS.LOSS_REASON, value: 'price', label: 'Price', sortOrder: 10 },
  { listKey: LOOKUP_LIST_KEYS.LOSS_REASON, value: 'competitor', label: 'Competitor', sortOrder: 20 },
  { listKey: LOOKUP_LIST_KEYS.LOSS_REASON, value: 'no_decision', label: 'No decision', sortOrder: 30 },
  { listKey: LOOKUP_LIST_KEYS.LOSS_REASON, value: 'bad_fit', label: 'Bad fit', sortOrder: 40 },
  { listKey: LOOKUP_LIST_KEYS.LOSS_REASON, value: 'other', label: 'Other', sortOrder: 50 },
];
