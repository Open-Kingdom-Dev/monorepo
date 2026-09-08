import { AppleMusicDemoHook } from './use-apple-music-demo';

interface AppleMusicFaultSimulationProps {
  demo: AppleMusicDemoHook;
}

export function AppleMusicFaultSimulation({
  demo,
}: AppleMusicFaultSimulationProps) {
  const {
    activeTwin,
    activatingError,
    currentErrorType,
    errorActive,
    handleSetErrorMode,
  } = demo;

  const errorModes = [
    { value: 'none', label: 'None (Healthy)' },
    { value: 'unauthorized', label: '401 Unauthorized' },
    { value: 'expired-token', label: '403 Expired Token' },
    { value: 'rate-limited', label: '429 Rate Limited' },
    { value: 'empty-results', label: '200 Empty Search Results' },
  ];

  return (
    <div className="border rounded-xl bg-white shadow-sm p-5 space-y-4">
      <h3 className="font-bold text-gray-900 border-b pb-2 text-md">
        Fault Simulation
      </h3>
      <div className="space-y-3">
        <label className="block text-xs font-semibold text-gray-500">
          Inject Simulated Error:
        </label>
        <select
          disabled={!activeTwin || activatingError}
          value={currentErrorType}
          onChange={(e) => handleSetErrorMode(e.target.value)}
          className="block w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm focus:border-red-500 focus:outline-none disabled:opacity-50"
        >
          {errorModes.map((mode) => (
            <option key={mode.value} value={mode.value}>
              {mode.label}
            </option>
          ))}
        </select>
        {errorActive && (
          <div className="p-3 bg-red-50 border border-red-100 text-red-800 text-xs rounded-lg font-medium leading-relaxed">
            ⚠️ Simulated mode active. Active requests to catalog or play tracks
            will return mock failures.
          </div>
        )}
      </div>
    </div>
  );
}
