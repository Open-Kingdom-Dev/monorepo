import { render, screen } from '@testing-library/react';
import { ActivityTimeline, type ActivityTimelineEntry } from './activity-timeline';

describe('ActivityTimeline', () => {
  const now = new Date('2026-04-18T10:00:00Z');
  const entries: ActivityTimelineEntry[] = [
    {
      id: 1,
      type: 'note',
      subject: 'Kickoff call notes',
      description: 'Talked about pricing.',
      timestamp: new Date('2026-04-15T12:00:00Z'),
      ownerLabel: 'Paul',
    },
    {
      id: 2,
      type: 'task',
      subject: 'Send proposal',
      timestamp: new Date('2026-04-10T09:00:00Z'),
      dueAt: new Date('2026-04-12T09:00:00Z'),
      ownerLabel: 'Paul',
    },
    {
      id: 3,
      type: 'call',
      subject: 'Follow-up call',
      timestamp: new Date('2026-04-01T09:00:00Z'),
      completedAt: new Date('2026-04-02T09:00:00Z'),
    },
  ];

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the empty state when no entries are provided', () => {
    render(<ActivityTimeline entries={[]} emptyState="Nothing here" />);
    expect(screen.getByTestId('activity-timeline-empty')).toBeTruthy();
    expect(screen.getByText('Nothing here')).toBeTruthy();
  });

  it('renders every entry with its subject', () => {
    render(<ActivityTimeline entries={entries} />);
    for (const entry of entries) {
      expect(screen.getByText(entry.subject)).toBeTruthy();
    }
  });

  it('flags overdue planned activities', () => {
    render(<ActivityTimeline entries={entries} />);
    const overdueItem = screen.getByTestId('activity-timeline-item-2');
    expect(overdueItem).toBeTruthy();
    expect(screen.getByText(/Overdue/)).toBeTruthy();
  });

  it('respects a custom timestamp formatter', () => {
    render(
      <ActivityTimeline
        entries={entries}
        formatTimestamp={(d) => `on-${d.getUTCFullYear()}`}
      />
    );
    expect(screen.getAllByText(/on-2026/).length).toBeGreaterThan(0);
  });
});
