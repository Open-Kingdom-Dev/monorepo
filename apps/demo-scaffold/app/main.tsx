import { RouterProvider } from 'react-router';
import { Provider } from 'react-redux';
import { createRoot } from 'react-dom/client';

import { ThemeProvider } from '@ynaa/shared-frontend-ui-theme';
import { SharedFeatureNotifications } from '@ynaa/shared-feature-notifications';

import { router } from './routes';
import { createAppStore } from './store.config';

const store = createAppStore();

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <ThemeProvider>
      <RouterProvider router={router} />
      <SharedFeatureNotifications />
    </ThemeProvider>
  </Provider>
);
