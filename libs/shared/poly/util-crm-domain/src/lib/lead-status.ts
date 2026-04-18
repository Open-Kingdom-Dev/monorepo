export const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'unqualified'] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const TERMINAL_LEAD_STATUSES: readonly LeadStatus[] = ['qualified', 'unqualified'] as const;

export function isTerminalLeadStatus(status: LeadStatus): boolean {
  return (TERMINAL_LEAD_STATUSES as readonly string[]).includes(status);
}
