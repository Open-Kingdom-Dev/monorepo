import { useDispatch } from 'react-redux';
import {
  useTwinControllerGetStatusQuery,
  useTwinControllerStartMutation,
  useTwinControllerStopMutation,
} from '@open-kingdom/shared-frontend-data-access-api-client';
import { showSuccessNotification } from '@open-kingdom/shared-frontend-data-access-notifications';

export function TwinStatus() {
  const dispatch = useDispatch();
  const {
    data: status,
    isLoading,
    error,
    refetch,
  } = useTwinControllerGetStatusQuery(undefined, {
    pollingInterval: 10000, // poll every 10 seconds
  });

  const [startTwin, { isLoading: starting }] = useTwinControllerStartMutation();
  const [stopTwin, { isLoading: stopping }] = useTwinControllerStopMutation();

  const handleStart = async () => {
    try {
      await startTwin().unwrap();
      dispatch(showSuccessNotification('GCS Twin started'));
    } catch (err) {
      console.error('Failed to start twin:', err);
    }
  };

  const handleStop = async () => {
    try {
      await stopTwin().unwrap();
      dispatch(showSuccessNotification('GCS Twin stopped'));
    } catch (err) {
      console.error('Failed to stop twin:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="border rounded-lg p-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900">GCS Twin</h3>
            <p className="text-sm text-gray-500">Checking status...</p>
          </div>
          <div className="h-4 w-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border rounded-lg p-4 bg-red-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-red-900">GCS Twin</h3>
            <p className="text-sm text-red-700">Failed to load status</p>
          </div>
          <button
            onClick={() => refetch()}
            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const running = status?.running ?? false;
  const healthy = status?.healthy ?? false;
  const port = status?.port ?? 9013;
  const url = status?.url;

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-medium text-gray-900">GCS Twin</h3>
          <p className="text-sm text-gray-500">
            Port {port} •{' '}
            {running ? (healthy ? 'Healthy' : 'Unhealthy') : 'Stopped'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div
            className={`h-3 w-3 rounded-full ${
              running
                ? healthy
                  ? 'bg-green-500'
                  : 'bg-yellow-500'
                : 'bg-gray-400'
            }`}
            title={
              running
                ? healthy
                  ? 'Running and healthy'
                  : 'Running but unhealthy'
                : 'Stopped'
            }
          ></div>
          <span className="text-sm font-medium">
            {running ? (healthy ? 'Running' : 'Unhealthy') : 'Stopped'}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleStart}
            disabled={running || starting}
            className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {starting ? 'Starting...' : 'Start Twin'}
          </button>
          <button
            onClick={handleStop}
            disabled={!running || stopping}
            className="px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {stopping ? 'Stopping...' : 'Stop Twin'}
          </button>
        </div>
        {url && (
          <div className="text-xs text-gray-500 truncate" title={url}>
            URL: <code className="bg-gray-100 px-1 rounded">{url}</code>
          </div>
        )}
        <div className="flex justify-end">
          <button
            onClick={() => refetch()}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}
