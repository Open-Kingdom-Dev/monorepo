import { render, screen } from '@testing-library/react';
import AboutComponent from '../app/routes/about';

describe('About Component', () => {
  it('should render successfully', () => {
    render(<AboutComponent />);
    expect(screen.getByText('About!!!')).toBeTruthy();
  });

  it('should render the correct heading', () => {
    render(<AboutComponent />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeTruthy();
  });
});
