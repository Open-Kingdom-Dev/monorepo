import { render, screen } from '@testing-library/react';
import { RecordDetail } from './record-detail';

describe('RecordDetail', () => {
  const baseTabs = [
    { id: 'overview', label: 'Overview', content: <p>Overview body</p> },
    { id: 'activity', label: 'Activity', content: <p>Activity body</p> },
  ];

  it('renders the title and the default tab content', () => {
    render(<RecordDetail title="Acme Corp" tabs={baseTabs} />);
    expect(screen.getByText('Acme Corp')).toBeTruthy();
    expect(screen.getByText('Overview body')).toBeTruthy();
  });

  it('renders the status and next-action slots when provided', () => {
    render(
      <RecordDetail
        title="Acme Corp"
        tabs={baseTabs}
        statusSlot="Discovery"
        nextActionSlot="Follow up Tuesday"
      />
    );
    expect(screen.getByTestId('record-detail-status')).toBeTruthy();
    expect(screen.getByTestId('record-detail-next-action')).toBeTruthy();
    expect(screen.getByText('Discovery')).toBeTruthy();
    expect(screen.getByText('Follow up Tuesday')).toBeTruthy();
  });

  it('throws when no tabs are provided', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() =>
      render(<RecordDetail title="Acme Corp" tabs={[]} />)
    ).toThrow(/at least one tab/);
    spy.mockRestore();
  });

  it('honors the defaultTabId prop', () => {
    render(
      <RecordDetail
        title="Acme Corp"
        tabs={baseTabs}
        defaultTabId="activity"
      />
    );
    expect(screen.getByText('Activity body')).toBeTruthy();
  });
});
