import { useDispatch } from 'react-redux';
import { useState, useCallback } from 'react';

import { logError } from '@open-kingdom/shared-frontend-data-access-logger';
import { showErrorNotification } from '@open-kingdom/shared-frontend-data-access-notifications';
import {
  ErrorBoundary,
  useErrorReporter,
} from '@open-kingdom/shared-frontend-feature-error-autologger';
import { useAuthControllerLoginMutation } from '@open-kingdom/shared-frontend-data-access-api-client';

function BuggyCounter({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('BuggyCounter crashed!');
  }
  return (
    <span className="text-success-600 dark:text-success-400">
      Component is stable
    </span>
  );
}

export function ErrorAutologgerExample() {
  const dispatch = useDispatch();
  const [shouldThrow, setShouldThrow] = useState(false);

  const [triggerLogin, { isLoading: isLoginLoading }] =
    useAuthControllerLoginMutation();

  const logger = useCallback(
    (message: string) => dispatch(logError(message)),
    [dispatch]
  );
  const notificationHandler = useCallback(
    (message: string) => dispatch(showErrorNotification(message)),
    [dispatch]
  );

  const reportError = useErrorReporter({
    logger,
    notificationHandler,
  });

  const handleTriggerApiError = async () => {
    try {
      await triggerLogin({
        loginDto: { email: 'invalid@test.com', password: 'wrong' },
      }).unwrap();
    } catch {
      // Error handled by RTK middleware
    }
  };

  const handleTriggerGlobalError = () => {
    setTimeout(() => {
      throw new Error('Unhandled global error!');
    }, 0);
  };

  const handleTriggerUnhandledRejection = () => {
    Promise.reject(new Error('Unhandled promise rejection!'));
  };

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-semibold mb-4 text-neutral-800 dark:text-neutral-200">
        Error Autologger Demo
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Manual Error Reporting */}
        <div className="bg-neutral-100 dark:bg-neutral-700 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
            Manual Error Reporting
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              data-testid="report-error-btn"
              onClick={() => reportError(new Error('Manual error report'))}
              className="px-3 py-2 bg-error-500 hover:bg-error-600 text-white rounded-md transition-colors text-sm"
            >
              Report Error
            </button>
            <button
              data-testid="report-string-error-btn"
              onClick={() => reportError('String error message')}
              className="px-3 py-2 bg-warning-500 hover:bg-warning-600 text-white rounded-md transition-colors text-sm"
            >
              Report String
            </button>
            <button
              data-testid="report-with-context-btn"
              onClick={() =>
                reportError(new Error('Error with context'), {
                  context: { userId: '123', action: 'demo' },
                  userMessage: 'Something went wrong in the demo!',
                })
              }
              className="px-3 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-md transition-colors text-sm"
            >
              With Context
            </button>
          </div>
        </div>

        {/* Error Boundary Demo */}
        <div className="bg-neutral-100 dark:bg-neutral-700 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
            Error Boundary
          </h3>
          <div className="mb-3 p-3 bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-600">
            <ErrorBoundary
              logger={logger}
              notificationHandler={notificationHandler}
              fallback={
                <div className="text-error-600 dark:text-error-400">
                  Component crashed! Error was logged and reported.
                </div>
              }
            >
              <BuggyCounter shouldThrow={shouldThrow} />
            </ErrorBoundary>
          </div>
          <button
            data-testid="trigger-boundary-error-btn"
            onClick={() => setShouldThrow(true)}
            disabled={shouldThrow}
            className="px-3 py-2 bg-error-500 hover:bg-error-600 disabled:bg-neutral-400 text-white rounded-md transition-colors text-sm"
          >
            {shouldThrow ? 'Error Triggered' : 'Trigger Error'}
          </button>
          {shouldThrow && (
            <button
              onClick={() => setShouldThrow(false)}
              className="ml-2 px-3 py-2 bg-success-500 hover:bg-success-600 text-white rounded-md transition-colors text-sm"
            >
              Reset
            </button>
          )}
        </div>

        {/* Global Error Listener Demo */}
        <div className="bg-neutral-100 dark:bg-neutral-700 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
            Global Error Listener
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              data-testid="trigger-global-error-btn"
              onClick={handleTriggerGlobalError}
              className="px-3 py-2 bg-error-500 hover:bg-error-600 text-white rounded-md transition-colors text-sm"
            >
              Trigger Global Error
            </button>
            <button
              data-testid="trigger-unhandled-rejection-btn"
              onClick={handleTriggerUnhandledRejection}
              className="px-3 py-2 bg-warning-500 hover:bg-warning-600 text-white rounded-md transition-colors text-sm"
            >
              Unhandled Rejection
            </button>
          </div>
        </div>

        {/* RTK Middleware Demo */}
        <div className="bg-neutral-100 dark:bg-neutral-700 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
            RTK Query Error Middleware
          </h3>
          <button
            data-testid="trigger-api-error-btn"
            onClick={handleTriggerApiError}
            disabled={isLoginLoading}
            className="px-4 py-2 bg-error-500 hover:bg-error-600 disabled:bg-neutral-400 text-white rounded-md transition-colors text-sm"
          >
            {isLoginLoading ? 'Calling API...' : 'Trigger Failing API Call'}
          </button>
        </div>
      </div>
    </div>
  );
}
