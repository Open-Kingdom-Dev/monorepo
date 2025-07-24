import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@ynaa/shared-ui-theme';

import { AppNav } from './app-nav';
import { createAppStore } from './store.config';
import { getAppMeta, getAppLinks } from './app.config';

// Export the business logic functions
export const meta = getAppMeta;
export const links = getAppLinks;

// Use the extracted store configuration
const store = createAppStore();

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Provider store={store}>
          <ThemeProvider>
            <AppNav />
            {children}
            <ScrollRestoration />
            <Scripts />
          </ThemeProvider>
        </Provider>
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
