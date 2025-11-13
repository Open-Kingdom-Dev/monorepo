import { NavLink } from 'react-router';

export function AppNav() {
  return (
    <>
      <h1>App Header</h1>
      <nav>
        <NavLink to="/" end>
          Home
        </NavLink>
        <NavLink to="/about" end>
          About
        </NavLink>
      </nav>
    </>
  );
}
