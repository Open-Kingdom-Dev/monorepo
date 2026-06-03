import { NavLink } from 'react-router';

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
      <NavLink to="/crm">CRM</NavLink>
      <NavLink to="/gcs-demo">GCS Demo</NavLink>
      <NavLink to="/gmail-demo">Gmail Demo</NavLink>
    </nav>
  );
}
