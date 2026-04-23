import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { AppNav } from './app-nav';

describe('AppNav Component', () => {
  const renderAppNav = (initialEntries = ['/']) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <AppNav />
      </MemoryRouter>
    );
  };

  it('should render successfully', () => {
    renderAppNav();
    expect(screen.getByRole('navigation')).toBeTruthy();
  });

  it('should render Home link', () => {
    renderAppNav();
    const homeLink = screen.getByRole('link', { name: 'Home' });
    expect(homeLink).toBeTruthy();
  });

  it('should have all navigation links', () => {
    renderAppNav();

    expect(screen.getByText('Home')).toBeTruthy();
    expect(screen.getByText('About')).toBeTruthy();
    expect(screen.getByText('Profile')).toBeTruthy();
    expect(screen.getByText('Users')).toBeTruthy();
  });

  it('should render navigation in proper structure', () => {
    renderAppNav();

    const nav = screen.getByRole('navigation');
    expect(nav).toBeTruthy();

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(5);
  });

  it('should handle different initial routes', () => {
    // Test rendering with about route
    renderAppNav(['/about']);

    expect(screen.getByText('Home')).toBeTruthy();
    expect(screen.getByText('About')).toBeTruthy();
  });
});
