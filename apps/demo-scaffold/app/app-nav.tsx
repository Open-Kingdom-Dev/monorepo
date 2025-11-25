import { NavLink } from 'react-router';

export function AppNav() {
  return (
    <nav className="flex gap-4">
      <NavLink to="/" end>
        Home
      </NavLink>
      <NavLink to="/about" end>
        About
      </NavLink>
      <NavLink to="/profile">Profile</NavLink>
    </nav>
  );
}
