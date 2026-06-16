interface YoutubeTwinStatusProps {
  activeTwin: boolean;
  loadingStatus: boolean;
  statusPort?: number;
  statusUrl?: string;
  startingTwin: boolean;
  stoppingTwin: boolean;
  resettingTwin: boolean;
  onStartTwin: () => void;
  onStopTwin: () => void;
  onResetTwin: () => void;
}

export function YoutubeTwinStatus({
  activeTwin,
  loadingStatus,
  statusPort,
  statusUrl,
  startingTwin,
  stoppingTwin,
  resettingTwin,
  onStartTwin,
  onStopTwin,
  onResetTwin,
}: YoutubeTwinStatusProps) {
  return (
    <div className="border rounded-xl bg-white shadow-sm p-5 space-y-4">
      <div className="border-b pb-3 flex justify-between items-center">
        <h3 className="font-bold text-gray-900 text-md">Twin Environment</h3>
        <span
          className={`px-2 py-0.5 text-xs font-extrabold rounded-full ${
            activeTwin
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {activeTwin ? 'ACTIVE' : 'OFFLINE'}
        </span>
      </div>
      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>Status:</span>
          <span className="font-semibold text-gray-900">
            {loadingStatus ? 'Checking...' : activeTwin ? 'Running' : 'Stopped'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Port:</span>
          <span className="font-mono text-xs font-semibold text-gray-900">
            {statusPort || 9016}
          </span>
        </div>
        {statusUrl && (
          <div className="flex justify-between">
            <span>URL:</span>
            <code className="text-xs bg-gray-100 px-1 rounded font-semibold text-gray-900 truncate max-w-[150px]">
              {statusUrl}
            </code>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 pt-2">
        <button
          onClick={onStartTwin}
          disabled={activeTwin || startingTwin}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition disabled:opacity-50"
        >
          {startingTwin ? 'Starting...' : 'Start'}
        </button>
        <button
          onClick={onStopTwin}
          disabled={!activeTwin || stoppingTwin}
          className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm transition disabled:opacity-50"
        >
          {stoppingTwin ? 'Stopping...' : 'Stop'}
        </button>
      </div>
      <button
        onClick={onResetTwin}
        disabled={!activeTwin || resettingTwin}
        className="w-full py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-bold rounded-lg transition disabled:opacity-50"
      >
        {resettingTwin ? 'Resetting...' : '🔄 Reset Fixtures & Errors'}
      </button>
    </div>
  );
}
