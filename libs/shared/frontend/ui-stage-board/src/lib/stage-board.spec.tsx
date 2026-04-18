import { render, screen, within } from '@testing-library/react';
import { StageBoard } from './stage-board';

interface TestCard {
  id: string;
  stage: 'new' | 'won';
  title: string;
}

describe('StageBoard', () => {
  const columns = [
    { id: 'new' as const, label: 'New' },
    { id: 'won' as const, label: 'Won' },
  ];
  const cards: TestCard[] = [
    { id: 'a', stage: 'new', title: 'Card A' },
    { id: 'b', stage: 'won', title: 'Card B' },
    { id: 'c', stage: 'new', title: 'Card C' },
  ];

  const setup = () =>
    render(
      <StageBoard
        columns={columns}
        cards={cards}
        getCardId={(c) => c.id}
        getCardColumnId={(c) => c.stage}
        renderCard={(c) => <span>{c.title}</span>}
      />
    );

  it('renders a column for each provided column', () => {
    setup();
    expect(screen.getByTestId('stage-board-column-new')).toBeTruthy();
    expect(screen.getByTestId('stage-board-column-won')).toBeTruthy();
  });

  it('renders each card under the correct column', () => {
    setup();
    const newColumn = screen.getByTestId('stage-board-column-new');
    expect(within(newColumn).getByTestId('stage-board-card-a')).toBeTruthy();
    expect(within(newColumn).getByTestId('stage-board-card-c')).toBeTruthy();
    const wonColumn = screen.getByTestId('stage-board-column-won');
    expect(within(wonColumn).getByTestId('stage-board-card-b')).toBeTruthy();
  });

  it('uses the provided renderCard for card content', () => {
    setup();
    expect(screen.getByText('Card A')).toBeTruthy();
    expect(screen.getByText('Card B')).toBeTruthy();
  });

  it('renders a custom empty-column message for columns with no cards', () => {
    render(
      <StageBoard
        columns={[{ id: 'lost', label: 'Lost' }]}
        cards={[]}
        getCardId={(c: TestCard) => c.id}
        getCardColumnId={(c: TestCard) => c.stage}
        renderCard={(c: TestCard) => <span>{c.title}</span>}
        emptyColumnMessage="Nothing lost"
      />
    );
    expect(screen.getByText('Nothing lost')).toBeTruthy();
  });
});
