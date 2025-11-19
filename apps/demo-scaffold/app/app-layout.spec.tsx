import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';

import { AppLayout } from './app-layout';

jest.mock('react-router', () => {
  const actual = jest.requireActual('react-router');
  return {
    ...actual,
    ScrollRestoration: () => (
      <div data-testid="scroll-restoration">ScrollRestoration</div>
    ),
  };
});

jest.mock('./app-nav', () => ({
  AppNav: () => <nav data-testid="app-nav">Navigation</nav>,
}));

describe('AppLayout', () => {
  const renderWithOutlet = (content: React.ReactNode) => {
    return render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<AppLayout />} path="/">
            <Route index element={content} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders navigation and outlet content', () => {
    renderWithOutlet(<div data-testid="outlet-content">Outlet</div>);

    expect(screen.getByTestId('app-nav')).toBeTruthy();
    expect(screen.getByTestId('outlet-content')).toHaveTextContent('Outlet');
    expect(screen.getByTestId('scroll-restoration')).toBeTruthy();
  });

  it('applies themed container styles', () => {
    renderWithOutlet(<div data-testid="outlet-content">Styled</div>);

    const themedContainer = document.querySelector('.max-w-7xl');
    expect(themedContainer).toBeTruthy();
    expect(themedContainer).toContainElement(
      screen.getByTestId('outlet-content')
    );
  });
});
