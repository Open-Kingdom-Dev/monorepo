import { NavLink, useLocation } from 'react-router';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@open-kingdom/shared-frontend-ui-theme';
import { ChevronDown, Database, Video, Mail, Shield } from 'lucide-react';

export function AppNav() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const isMockServerActive =
    location.pathname === '/gcs-demo' ||
    location.pathname === '/youtube-demo' ||
    location.pathname === '/gmail-demo' ||
    location.pathname === '/google-auth-demo';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'text-sm font-medium transition-colors hover:text-foreground/80',
      isActive ? 'text-foreground font-semibold' : 'text-muted-foreground'
    );

  return (
    <nav className="flex flex-wrap items-center gap-6 border-b border-border bg-card/50 backdrop-blur px-8 py-4 w-full">
      <NavLink to="/" end className={linkClass}>
        Home
      </NavLink>
      <NavLink to="/about" end className={linkClass}>
        About
      </NavLink>
      <NavLink to="/profile" className={linkClass}>
        Profile
      </NavLink>
      <NavLink to="/admin/users" className={linkClass}>
        Users
      </NavLink>
      <NavLink to="/crm" className={linkClass}>
        CRM
      </NavLink>

      {/* Mock Server Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-foreground/80 focus:outline-none select-none',
            isMockServerActive
              ? 'text-foreground font-semibold'
              : 'text-muted-foreground'
          )}
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          Mock Server
          <ChevronDown
            className={cn(
              'h-4 w-4 transition-transform duration-200 opacity-70',
              isOpen && 'rotate-180'
            )}
          />
        </button>

        {isOpen && (
          <div
            className="absolute left-0 mt-2 w-48 rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-50 slide-in-from-top-1 duration-150 z-50"
            role="menu"
          >
            <NavLink
              to="/gcs-demo"
              onClick={() => setIsOpen(false)}
              role="menuitem"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-sm px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
                  isActive
                    ? 'bg-accent text-accent-foreground font-semibold'
                    : 'text-muted-foreground'
                )
              }
            >
              <Database className="h-4 w-4" />
              GCS Demo
            </NavLink>
            <NavLink
              to="/gmail-demo"
              onClick={() => setIsOpen(false)}
              role="menuitem"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-sm px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
                  isActive
                    ? 'bg-accent text-accent-foreground font-semibold'
                    : 'text-muted-foreground'
                )
              }
            >
              <Mail className="h-4 w-4" />
              Gmail Demo
            </NavLink>
            <NavLink
              to="/youtube-demo"
              onClick={() => setIsOpen(false)}
              role="menuitem"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-sm px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
                  isActive
                    ? 'bg-accent text-accent-foreground font-semibold'
                    : 'text-muted-foreground'
                )
              }
            >
              <Video className="h-4 w-4" />
              YouTube Demo
            </NavLink>
            <NavLink
              to="/google-auth-demo"
              onClick={() => setIsOpen(false)}
              role="menuitem"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-sm px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
                  isActive
                    ? 'bg-accent text-accent-foreground font-semibold'
                    : 'text-muted-foreground'
                )
              }
            >
              <Shield className="h-4 w-4" />
              Google Auth Demo
            </NavLink>
          </div>
        )}
      </div>
    </nav>
  );
}
