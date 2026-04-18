import { NavLink } from 'react-router';
import { crmNavEntries } from '@open-kingdom/shared-frontend-feature-crm';

export function AppNav() {
  return (
    <nav className="flex flex-wrap gap-4">
      <NavLink to="/" end>
        Home
      </NavLink>
      <NavLink to="/about" end>
        About
      </NavLink>
      <NavLink to="/profile">Profile</NavLink>
      <NavLink to="/admin/users">Users</NavLink>
      {crmNavEntries.map((entry) => (
        <NavLink key={entry.path} to={entry.path} end={entry.path === '/crm'}>
          {entry.label}
        </NavLink>
      ))}
      <NavLink to="/gcs-demo">GCS Demo</NavLink>
    </nav>
  );
}
