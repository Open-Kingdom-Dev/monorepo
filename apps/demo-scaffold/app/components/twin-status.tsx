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
    pollingInterval: 10000,
  });

  const [startTwin, { isLoading: starting }] = useTwinControllerStartMutation();
  const [stopTwin, { isLoading: stopping }] = useTwinControllerStopMutation();

  const handleStart = async () => {
    try {
      await startTwin().unwrap();
      dispatch(
        showSuccessNotification(
          'Digital Twin Environment started successfully!'
        )
      );
      refetch();
    } catch (err) {
      console.error('Failed to start twin:', err);
    }
  };

  const handleStop = async () => {
    try {
      await stopTwin().unwrap();
      dispatch(
        showSuccessNotification('Digital Twin Environment stopped cleanly.')
      );
      refetch();
    } catch (err) {
      console.error('Failed to stop twin:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="border rounded-lg p-4 bg-gray-50 flex items-center justify-between">
        <span className="text-sm text-gray-500 font-medium">
          Checking status...
        </span>
        <div className="h-4 w-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border rounded-lg p-4 bg-red-50 flex items-center justify-between">
        <span className="text-sm text-red-700 font-medium">
          Failed to load status
        </span>
        <button
          onClick={() => refetch()}
          className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
        >
          Retry
        </button>
      </div>
    );
  }

  const running = status?.running ?? false;
  const healthy = status?.healthy ?? false;
  const port = status?.port ?? 9013;
  const gcsOnline = status?.gcsOnline ?? false;

  // Gmail digital twin specific fields
  const gmail = status?.gmail;
  const interceptorActive = status?.interceptorActive ?? false;

  return (
    <div className="border rounded-lg p-5 bg-white shadow-sm space-y-4">
      <div className="border-b pb-3 flex justify-between items-center">
        <h3 className="font-semibold text-gray-900 text-md">
          Twin Environment Launcher
        </h3>
        <span
          className={`px-2 py-0.5 text-xs font-bold rounded-full transition-colors duration-300 ${
            running
              ? healthy
                ? 'bg-green-500 text-white'
                : 'bg-yellow-500 text-white'
              : 'bg-gray-400 text-white'
          }`}
        >
          {running ? (healthy ? 'Running' : 'Unhealthy') : 'Stopped'}
        </span>
      </div>

      <div className="space-y-2.5">
        {/* GCS Twin Row */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600 font-medium">
            GCS Storage Emulator:
          </span>
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full transition-all duration-500 ${
                running && gcsOnline
                  ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse'
                  : running
                  ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]'
                  : 'bg-gray-300'
              }`}
            ></span>
            <span className="font-mono text-xs">
              {running ? (
                gcsOnline ? (
                  status?.url ? (
                    <a
                      href={status.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {status.url}
                    </a>
                  ) : (
                    `Port ${port}`
                  )
                ) : (
                  'Offline (Docker is not running)'
                )
              ) : (
                'Stopped'
              )}
            </span>
          </div>
        </div>

        {/* Gmail Twin Row */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600 font-medium">
            Gmail REST Mock Server:
          </span>
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full transition-all duration-500 ${
                gmail?.running
                  ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse'
                  : 'bg-gray-300'
              }`}
            ></span>
            <span className="font-mono text-xs">
              {gmail?.running ? (
                gmail?.url ? (
                  <a
                    href={gmail.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {gmail.url}
                  </a>
                ) : (
                  `Port ${gmail?.port ?? 9014}`
                )
              ) : (
                'Stopped'
              )}
            </span>
          </div>
        </div>

        {/* Global Interception Layer */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600 font-medium">
            Global Network Interception:
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded font-semibold transition-all duration-300 ${
              interceptorActive
                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                : 'bg-gray-100 text-gray-600 border border-gray-200'
            }`}
          >
            {interceptorActive ? 'ACTIVE (Zero-Config)' : 'INACTIVE'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2">
        <button
          onClick={handleStart}
          disabled={running || starting}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out shadow-sm"
        >
          {starting ? 'Starting...' : 'Boot All'}
        </button>
        <button
          onClick={handleStop}
          disabled={!running || stopping}
          className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out shadow-sm"
        >
          {stopping ? 'Stopping...' : 'Shutdown'}
        </button>
      </div>

      <div className="flex justify-end text-xs pt-1 border-t">
        <button
          onClick={() => refetch()}
          className="text-gray-400 hover:text-gray-600 font-medium transition duration-150"
        >
          🔄 Refresh Status
        </button>
      </div>
    </div>
  );
}
