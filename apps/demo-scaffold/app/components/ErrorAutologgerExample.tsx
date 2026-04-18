import { useDispatch } from 'react-redux';
import { useState, useCallback } from 'react';

import { logError } from '@open-kingdom/shared-frontend-data-access-logger';
import { showErrorNotification } from '@open-kingdom/shared-frontend-data-access-notifications';
import {
  ErrorBoundary,
  useErrorReporter,
} from '@open-kingdom/shared-frontend-feature-error-autologger';
import { useAuthControllerLoginMutation } from '@open-kingdom/shared-frontend-data-access-api-client';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@open-kingdom/shared-frontend-ui-primitives';

function BuggyCounter({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('BuggyCounter crashed!');
  }
  return <span className="text-success">Component is stable</span>;
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
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Error Autologger Demo</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-foreground mb-3">
              Manual Error Reporting
            </h3>
            <div className="flex flex-wrap gap-2">
              <Button
                data-testid="report-error-btn"
                variant="destructive"
                size="sm"
                onClick={() => reportError(new Error('Manual error report'))}
              >
                Report Error
              </Button>
              <Button
                data-testid="report-string-error-btn"
                variant="warning"
                size="sm"
                onClick={() => reportError('String error message')}
              >
                Report String
              </Button>
              <Button
                data-testid="report-with-context-btn"
                size="sm"
                onClick={() =>
                  reportError(new Error('Error with context'), {
                    context: { userId: '123', action: 'demo' },
                    userMessage: 'Something went wrong in the demo!',
                  })
                }
              >
                With Context
              </Button>
            </div>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-foreground mb-3">
              Error Boundary
            </h3>
            <div className="mb-3 p-3 bg-card rounded border border-border">
              <ErrorBoundary
                logger={logger}
                notificationHandler={notificationHandler}
                fallback={
                  <div className="text-destructive">
                    Component crashed! Error was logged and reported.
                  </div>
                }
              >
                <BuggyCounter shouldThrow={shouldThrow} />
              </ErrorBoundary>
            </div>
            <Button
              data-testid="trigger-boundary-error-btn"
              variant="destructive"
              size="sm"
              onClick={() => setShouldThrow(true)}
              disabled={shouldThrow}
            >
              {shouldThrow ? 'Error Triggered' : 'Trigger Error'}
            </Button>
            {shouldThrow && (
              <Button
                variant="success"
                size="sm"
                className="ml-2"
                onClick={() => setShouldThrow(false)}
              >
                Reset
              </Button>
            )}
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-foreground mb-3">
              Global Error Listener
            </h3>
            <div className="flex flex-wrap gap-2">
              <Button
                data-testid="trigger-global-error-btn"
                variant="destructive"
                size="sm"
                onClick={handleTriggerGlobalError}
              >
                Trigger Global Error
              </Button>
              <Button
                data-testid="trigger-unhandled-rejection-btn"
                variant="warning"
                size="sm"
                onClick={handleTriggerUnhandledRejection}
              >
                Unhandled Rejection
              </Button>
            </div>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-foreground mb-3">
              RTK Query Error Middleware
            </h3>
            <Button
              data-testid="trigger-api-error-btn"
              variant="destructive"
              size="sm"
              onClick={handleTriggerApiError}
              disabled={isLoginLoading}
            >
              {isLoginLoading ? 'Calling API...' : 'Trigger Failing API Call'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
