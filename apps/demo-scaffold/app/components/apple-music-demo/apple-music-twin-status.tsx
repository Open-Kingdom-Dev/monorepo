import { AppleMusicDemoHook } from './use-apple-music-demo';

interface AppleMusicTwinStatusProps {
  demo: AppleMusicDemoHook;
}

export function AppleMusicTwinStatus({ demo }: AppleMusicTwinStatusProps) {
  const {
    activeTwin,
    loadingStatus,
    status,
    startingTwin,
    stoppingTwin,
    resettingTwin,
    handleStartTwin,
    handleStopTwin,
    handleResetTwin,
  } = demo;

  return (
    <div className="border rounded-xl bg-white shadow-sm p-5 space-y-4">
      <div className="flex justify-between items-center border-b pb-2">
        <h3 className="font-bold text-gray-900 text-md">Twin Lifecycle</h3>
        {loadingStatus ? (
          <span className="text-xs text-gray-400">Loading...</span>
        ) : (
          <span className={`h-2.5 w-2.5 rounded-full ${activeTwin ? 'bg-green-500' : 'bg-red-500'}`} />
        )}
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-500">Service Port:</span>
          <span className="font-semibold text-gray-800">{status?.port || 9019}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Emulator URL:</span>
          <a
            href={status?.url}
            target="_blank"
            rel="noreferrer"
            className="text-red-600 hover:underline font-semibold"
          >
            {status?.url || `http://localhost:${status?.port || 9019}`}
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2">
        {activeTwin ? (
          <button
            onClick={handleStopTwin}
            disabled={stoppingTwin}
            className="col-span-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-3 rounded-lg text-sm transition"
          >
            {stoppingTwin ? 'Stopping...' : 'Stop Twin Service'}
          </button>
        ) : (
          <button
            onClick={handleStartTwin}
            disabled={startingTwin}
            className="col-span-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-3 rounded-lg text-sm transition"
          >
            {startingTwin ? 'Starting...' : 'Start Twin Service'}
          </button>
        )}
        <button
          onClick={handleResetTwin}
          disabled={!activeTwin || resettingTwin}
          className="col-span-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2 px-3 rounded-lg text-sm transition disabled:opacity-50"
        >
          {resettingTwin ? 'Resetting...' : 'Reset Twin State'}
        </button>
      </div>
    </div>
  );
}
