import { AppNav } from './app-nav';
import { Outlet, ScrollRestoration } from 'react-router';

export function AppLayout() {
  return (
    <>
      <AppNav />
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 p-8">
        <div className="max-w-4xl mx-auto">
          <Outlet />
        </div>
      </div>
      <ScrollRestoration />
    </>
  );
}
