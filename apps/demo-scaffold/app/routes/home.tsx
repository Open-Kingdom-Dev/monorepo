import { useSelector, useDispatch } from 'react-redux';

import {
  logInfo,
  selectLogs,
} from '@open-kingdom/shared-frontend-data-access-logger';
import { useTheme } from '@open-kingdom/shared-frontend-ui-theme';
import {
  selectActiveNotificationCount,
  showErrorNotification,
  showSuccessNotification,
  showWarningNotification,
} from '@open-kingdom/shared-frontend-data-access-notifications';
import { GridExample } from '../components';

export function Home() {
  const logs = useSelector(selectLogs);
  const notificationCount = useSelector(selectActiveNotificationCount);
  const dispatch = useDispatch();
  const { mode, setMode } = useTheme();


  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-primary-600 dark:text-primary-400">
          Hello World
        </h1>
        <button
          onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
          className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg shadow-md transition-colors"
        >
          Toggle {mode === 'light' ? 'Dark' : 'Light'} Mode
        </button>
      </div>

      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4 text-neutral-800 dark:text-neutral-200">
          Application State
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-neutral-600 dark:text-neutral-300 mb-2">
              Logs:
              <span
                data-testid="logs-count"
                className="font-mono text-primary-600 dark:text-primary-400 ml-2"
              >
                {logs.length}
              </span>
            </p>
            <button
              data-testid="log-info-btn"
              onClick={() => dispatch(logInfo('Hello World'))}
              className="px-4 py-2 bg-success-500 hover:bg-success-600 text-white rounded-md transition-colors"
            >
              Log Info
            </button>
          </div>
          <div>
            <p className="text-neutral-600 dark:text-neutral-300 mb-2">
              Notifications:
              <span
                data-testid="notifications-count"
                className="font-mono text-primary-600 dark:text-primary-400 ml-2"
              >
                {notificationCount}
              </span>
            </p>
            <div className="flex gap-2">
              <button
                data-testid="show-success-btn"
                onClick={() =>
                  dispatch(
                    showSuccessNotification('Operation completed successfully!')
                  )
                }
                className="px-3 py-2 bg-success-500 hover:bg-success-600 text-white rounded-md transition-colors text-sm"
              >
                Success
              </button>
              <button
                data-testid="show-warning-btn"
                onClick={() =>
                  dispatch(
                    showWarningNotification(
                      'Please review your input before proceeding.'
                    )
                  )
                }
                className="px-3 py-2 bg-warning-500 hover:bg-warning-600 text-white rounded-md transition-colors text-sm"
              >
                Warning
              </button>
              <button
                data-testid="show-error-btn"
                onClick={() =>
                  dispatch(
                    showErrorNotification(
                      'An error occurred while processing your request.'
                    )
                  )
                }
                className="px-3 py-2 bg-error-500 hover:bg-error-600 text-white rounded-md transition-colors text-sm"
              >
                Error
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4 text-neutral-800 dark:text-neutral-200">
          Color Palette Demo
        </h2>
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg border border-primary-200 dark:border-primary-700">
            <h3 className="text-lg font-semibold text-primary-800 dark:text-primary-200 mb-2">
              Primary Colors
            </h3>
            <p className="text-primary-600 dark:text-primary-400">
              This demonstrates the primary color palette.
            </p>
          </div>

          <div className="bg-secondary-50 dark:bg-secondary-900/20 p-4 rounded-lg border border-secondary-200 dark:border-secondary-700">
            <h3 className="text-lg font-semibold text-secondary-800 dark:text-secondary-200 mb-2">
              Secondary Colors
            </h3>
            <p className="text-secondary-600 dark:text-secondary-400">
              This demonstrates the secondary color palette.
            </p>
          </div>

          <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
            <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-2">
              Neutral Colors
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400">
              This demonstrates the neutral color palette.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4 text-neutral-800 dark:text-neutral-200">
          Data Grid Demo
        </h2>

        <GridExample />
      </div>
    </>
  );
}
