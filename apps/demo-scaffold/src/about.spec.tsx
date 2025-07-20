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

  it('should have proper component structure', () => {
    render(<AboutComponent />);
    
    // Check that it renders the heading content
    const content = screen.getByText('About!!!');
    expect(content).toBeTruthy();
  });

  it('should render without any props', () => {
    // Test that component doesn't require any props
    expect(() => {
      render(<AboutComponent />);
    }).not.toThrow();
  });

  it('should be a simple static component', () => {
    render(<AboutComponent />);
    
    // Verify it's a simple component with just the heading
    const allElements = screen.getByRole('heading');
    expect(allElements).toBeTruthy();
  });
}); 