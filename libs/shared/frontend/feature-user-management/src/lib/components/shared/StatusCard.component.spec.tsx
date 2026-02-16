import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StatusCard } from './StatusCard.component';

describe('StatusCard', () => {
  it('shows a loading message', () => {
    render(<StatusCard variant="loading" message="Loading..." />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('announces errors to screen readers', () => {
    render(
      <StatusCard
        variant="error"
        title="Error"
        message="Something went wrong"
      />
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('shows a success message', () => {
    render(<StatusCard variant="success" title="Done" message="All good" />);
    expect(screen.getByText('Done')).toBeInTheDocument();
    expect(screen.getByText('All good')).toBeInTheDocument();
  });

  it('displays additional content like links', () => {
    render(
      <StatusCard variant="success" title="Done" message="All good">
        <a href="/login">Go to login</a>
      </StatusCard>
    );
    expect(screen.getByText('Go to login')).toBeInTheDocument();
  });

  it('shows only the message when no title is given', () => {
    render(<StatusCard variant="error" message="Something went wrong" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });
});
