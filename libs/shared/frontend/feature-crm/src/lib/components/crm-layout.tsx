import { NavLink, Outlet } from 'react-router';
import { cn } from '@open-kingdom/shared-frontend-ui-theme';
import { crmNavEntries } from '../routes';

export function CrmLayout() {
  return (
    <div className="flex flex-col gap-4">
      <nav className="flex flex-wrap gap-3 border-b border-border pb-3">
        {crmNavEntries.map((entry) => (
          <NavLink
            key={entry.path}
            to={entry.path}
            end={entry.path === '/crm'}
            className={({ isActive }) =>
              cn(
                'text-sm text-muted-foreground hover:text-foreground',
                isActive && 'font-semibold text-foreground'
              )
            }
          >
            {entry.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
