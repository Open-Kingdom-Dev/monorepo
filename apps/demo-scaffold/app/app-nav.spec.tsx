import { render, screen, fireEvent } from '@testing-library/react';
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

  it('should have base navigation links', () => {
    renderAppNav();

    expect(screen.getByText('Home')).toBeTruthy();
    expect(screen.getByText('About')).toBeTruthy();
    expect(screen.getByText('Profile')).toBeTruthy();
    expect(screen.getByText('Users')).toBeTruthy();
    expect(screen.getByText('CRM')).toBeTruthy();
  });

  it('should render dropdown trigger and hide dropdown links initially', () => {
    const { container } = renderAppNav();

    const trigger = screen.getByRole('button', { name: /Mock Server/i });
    expect(trigger).toBeTruthy();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    // Dropdown links should not be present initially
    expect(screen.queryByText('GCS Demo')).toBeNull();
    expect(screen.queryByText('Gmail Demo')).toBeNull();
    expect(screen.queryByText('YouTube Demo')).toBeNull();
    expect(screen.queryByText('Google Auth Demo')).toBeNull();

    // 5 base links: Home, About, Profile, Users, CRM
    const links = container.querySelectorAll('a');
    expect(links).toHaveLength(5);
  });

  it('should open the dropdown menu on trigger click and show dropdown links', () => {
    const { container } = renderAppNav();

    const trigger = screen.getByRole('button', { name: /Mock Server/i });
    fireEvent.click(trigger);

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('GCS Demo')).toBeTruthy();
    expect(screen.getByText('Gmail Demo')).toBeTruthy();
    expect(screen.getByText('YouTube Demo')).toBeTruthy();
    expect(screen.getByText('Google Auth Demo')).toBeTruthy();

    // 5 base links + 4 dropdown links = 9 links total
    const links = container.querySelectorAll('a');
    expect(links).toHaveLength(9);
  });

  it('should close the dropdown menu when a dropdown link is clicked', () => {
    renderAppNav();

    const trigger = screen.getByRole('button', { name: /Mock Server/i });
    fireEvent.click(trigger);

    const gcsLink = screen.getByText('GCS Demo');
    fireEvent.click(gcsLink);

    // Dropdown links should be closed/hidden now
    expect(screen.queryByText('GCS Demo')).toBeNull();
    expect(screen.queryByText('Gmail Demo')).toBeNull();
    expect(screen.queryByText('YouTube Demo')).toBeNull();
    expect(screen.queryByText('Google Auth Demo')).toBeNull();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('should close the dropdown menu when clicking outside', () => {
    renderAppNav();

    const trigger = screen.getByRole('button', { name: /Mock Server/i });
    fireEvent.click(trigger);

    expect(screen.getByText('GCS Demo')).toBeTruthy();

    // Click outside on document body
    fireEvent.mouseDown(document.body);

    expect(screen.queryByText('GCS Demo')).toBeNull();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('should highlight Mock Server trigger when a child route is active', () => {
    renderAppNav(['/google-auth-demo']);

    const trigger = screen.getByRole('button', { name: /Mock Server/i });
    // Active styling check: we expect "text-foreground font-semibold"
    expect(trigger.className).toContain('text-foreground');
    expect(trigger.className).toContain('font-semibold');
  });

  it('should handle different initial routes', () => {
    renderAppNav(['/about']);

    expect(screen.getByText('Home')).toBeTruthy();
    expect(screen.getByText('About')).toBeTruthy();
  });
});
