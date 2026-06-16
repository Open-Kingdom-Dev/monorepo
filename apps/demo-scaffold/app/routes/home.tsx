import { useSelector, useDispatch } from 'react-redux';

import {
  logInfo,
  selectLogs,
} from '@open-kingdom/shared-frontend-data-access-logger';
import { useColorMode } from '@open-kingdom/shared-frontend-ui-theme';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@open-kingdom/shared-frontend-ui-primitives';
import {
  selectActiveNotificationCount,
  showErrorNotification,
  showSuccessNotification,
  showWarningNotification,
} from '@open-kingdom/shared-frontend-data-access-notifications';
import { useGetFactQuery } from '@open-kingdom/shared-frontend-data-access-external-api';
import {
  AdvancedGridExample,
  DualListExample,
  ErrorAutologgerExample,
  GridExample,
} from '../components';

export function Home() {
  const logs = useSelector(selectLogs);
  const notificationCount = useSelector(selectActiveNotificationCount);
  const dispatch = useDispatch();
  const { mode, setMode } = useColorMode();
  const { data: catFact, isLoading, isFetching, refetch } = useGetFactQuery();

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-primary">Hello World</h1>
        <Button onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}>
          Toggle {mode === 'light' ? 'Dark' : 'Light'} Mode
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Application State</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-muted-foreground mb-2">
                Logs:
                <span
                  data-testid="logs-count"
                  className="font-mono text-primary ml-2"
                >
                  {logs.length}
                </span>
              </p>
              <Button
                data-testid="log-info-btn"
                variant="success"
                onClick={() => dispatch(logInfo('Hello World'))}
              >
                Log Info
              </Button>
            </div>
            <div>
              <p className="text-muted-foreground mb-2">
                Notifications:
                <span
                  data-testid="notifications-count"
                  className="font-mono text-primary ml-2"
                >
                  {notificationCount}
                </span>
              </p>
              <div className="flex gap-2">
                <Button
                  data-testid="show-success-btn"
                  variant="success"
                  size="sm"
                  onClick={() =>
                    dispatch(
                      showSuccessNotification(
                        'Operation completed successfully!'
                      )
                    )
                  }
                >
                  Success
                </Button>
                <Button
                  data-testid="show-warning-btn"
                  variant="warning"
                  size="sm"
                  onClick={() =>
                    dispatch(
                      showWarningNotification(
                        'Please review your input before proceeding.'
                      )
                    )
                  }
                >
                  Warning
                </Button>
                <Button
                  data-testid="show-error-btn"
                  variant="destructive"
                  size="sm"
                  onClick={() =>
                    dispatch(
                      showErrorNotification(
                        'An error occurred while processing your request.'
                      )
                    )
                  }
                >
                  Error
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <ErrorAutologgerExample />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Color Palette Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
              <h3 className="text-lg font-semibold text-primary mb-2">
                Primary Colors
              </h3>
              <p className="text-primary/80">
                This demonstrates the primary color palette.
              </p>
            </div>

            <div className="bg-secondary/10 p-4 rounded-lg border border-secondary/20">
              <h3 className="text-lg font-semibold text-secondary mb-2">
                Secondary Colors
              </h3>
              <p className="text-secondary/80">
                This demonstrates the secondary color palette.
              </p>
            </div>

            <div className="bg-muted p-4 rounded-lg border border-border">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Neutral Colors
              </h3>
              <p className="text-muted-foreground">
                This demonstrates the neutral color palette.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Data Grid Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <GridExample />
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Advanced Data Grid Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <AdvancedGridExample />
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Dual List Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <DualListExample />
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>External API Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Demonstrates RTK Query with Axios for third-party API integration.
          </p>
          <div className="bg-muted rounded-lg p-4 mb-4 min-h-[80px]">
            {isLoading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : (
              <p data-testid="cat-fact" className="text-foreground">
                {catFact?.fact}
              </p>
            )}
          </div>
          <Button
            data-testid="fetch-cat-fact-btn"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? 'Fetching...' : 'Get New Fact'}
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
