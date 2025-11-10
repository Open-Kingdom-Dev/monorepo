import { render, screen } from '@testing-library/react';
import Table from './table';


describe('Table', () => {
  it('should render successfully', () => {
    render(<Table />);
    expect(screen.getByText('Data Grid')).toBeTruthy();
  });
}); 