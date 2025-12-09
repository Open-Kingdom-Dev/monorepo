import { RouterProvider } from 'react-router';
import { Provider, useDispatch } from 'react-redux';
import { createRoot } from 'react-dom/client';
import { useCallback } from 'react';

import { ThemeProvider } from '@open-kingdom/shared-frontend-ui-theme';
import { SharedFeatureNotifications } from '@open-kingdom/shared-feature-notifications';
import { logError } from '@open-kingdom/shared-frontend-data-access-logger';
import { showErrorNotification } from '@open-kingdom/shared-frontend-data-access-notifications';
import { useGlobalErrorListener } from '@open-kingdom/shared-frontend-feature-error-autologger';

import { router } from './routes';
import { createAppStore } from './store.config';

function GlobalErrorListener() {
  const dispatch = useDispatch();

  const logger = useCallback(
    (message: string) => dispatch(logError(message)),
    [dispatch]
  );
  const notificationHandler = useCallback(
    (message: string) => dispatch(showErrorNotification(message)),
    [dispatch]
  );

  useGlobalErrorListener({
    logger,
    notificationHandler,
    notify: true,
    log: true,
  });

  return null;
}

const store = createAppStore();

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <GlobalErrorListener />
    <ThemeProvider>
      <RouterProvider router={router} />
      <SharedFeatureNotifications />
    </ThemeProvider>
  </Provider>
);
