import { AppNav } from './app-nav';
import { Outlet, ScrollRestoration } from 'react-router';

export function AppLayout() {
  return (
    <>
      <AppNav />
      <div className="min-h-screen bg-background text-foreground p-8">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </div>
      <ScrollRestoration />
    </>
  );
}
