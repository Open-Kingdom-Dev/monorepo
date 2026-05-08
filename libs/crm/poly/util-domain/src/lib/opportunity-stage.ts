export const OPPORTUNITY_STAGES = [
  'new',
  'discovery',
  'proposal',
  'negotiation',
  'won',
  'lost',
] as const;

export type OpportunityStage = (typeof OPPORTUNITY_STAGES)[number];

export const TERMINAL_OPPORTUNITY_STAGES: readonly OpportunityStage[] = [
  'won',
  'lost',
] as const;

export function isTerminalOpportunityStage(stage: OpportunityStage): boolean {
  return (TERMINAL_OPPORTUNITY_STAGES as readonly string[]).includes(stage);
}

export function isWonStage(stage: OpportunityStage): boolean {
  return stage === 'won';
}

export function isLostStage(stage: OpportunityStage): boolean {
  return stage === 'lost';
}
