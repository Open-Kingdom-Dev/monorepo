import {
  ACTIVITY_TYPES,
  LEAD_STATUSES,
  OPPORTUNITY_STAGES,
  RELATED_ENTITY_TYPES,
  isActivityType,
  isRelatedEntityType,
  isLostStage,
  isTerminalLeadStatus,
  isTerminalOpportunityStage,
  isWonStage,
  supportsDueDate,
} from '../index.js';

describe('util-crm-domain', () => {
  it('exposes the canonical related-entity types', () => {
    expect(RELATED_ENTITY_TYPES).toEqual([
      'contact',
      'company',
      'lead',
      'opportunity',
    ]);
    expect(isRelatedEntityType('contact')).toBe(true);
    expect(isRelatedEntityType('horse')).toBe(false);
  });

  it('exposes the canonical activity types and due-date support', () => {
    expect(ACTIVITY_TYPES).toEqual([
      'note',
      'call',
      'meeting',
      'email',
      'task',
    ]);
    expect(isActivityType('note')).toBe(true);
    expect(supportsDueDate('task')).toBe(true);
    expect(supportsDueDate('note')).toBe(false);
  });

  it('marks qualified and unqualified as terminal lead statuses', () => {
    expect(LEAD_STATUSES).toContain('qualified');
    expect(isTerminalLeadStatus('qualified')).toBe(true);
    expect(isTerminalLeadStatus('new')).toBe(false);
  });

  it('marks won and lost as terminal opportunity stages', () => {
    expect(OPPORTUNITY_STAGES).toContain('won');
    expect(isTerminalOpportunityStage('won')).toBe(true);
    expect(isTerminalOpportunityStage('lost')).toBe(true);
    expect(isTerminalOpportunityStage('discovery')).toBe(false);
  });

  it('distinguishes won from lost stages', () => {
    expect(isWonStage('won')).toBe(true);
    expect(isWonStage('lost')).toBe(false);
    expect(isLostStage('lost')).toBe(true);
    expect(isLostStage('won')).toBe(false);
  });
});
