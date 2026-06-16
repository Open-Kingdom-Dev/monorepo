/* eslint-disable jsx-a11y/accessible-emoji */
interface YoutubeFaultSimulationProps {
  activeTwin: boolean;
  activatingError: boolean;
  currentErrorType: string;
  errorActive: boolean;
  onSetErrorMode: (mode: string) => void;
}

export function YoutubeFaultSimulation({
  activeTwin,
  activatingError,
  currentErrorType,
  errorActive,
  onSetErrorMode,
}: YoutubeFaultSimulationProps) {
  return (
    <div className="border rounded-xl bg-white shadow-sm p-5 space-y-4">
      <h3 className="font-bold text-gray-900 border-b pb-2 text-md">
        Fault Simulation
      </h3>
      <p className="text-xs text-gray-500 leading-relaxed">
        Inject API queries or media delivery exceptions into the YouTube twin.
        Active:
        <span
          className={`ml-1 font-bold ${
            errorActive ? 'text-purple-600' : 'text-gray-700'
          }`}
        >
          {currentErrorType}
        </span>
      </p>

      <div className="flex flex-col gap-2">
        <button
          onClick={() => onSetErrorMode('none')}
          disabled={!activeTwin || activatingError}
          className={`w-full py-2 px-3 text-left rounded-lg text-xs font-bold transition border ${
            currentErrorType === 'none'
              ? 'bg-green-50 border-green-300 text-green-800'
              : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700'
          }`}
        >
          🟢 Normal Pass-Through
        </button>

        <div className="space-y-1.5 pt-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
            API Errors
          </span>
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => onSetErrorMode('daily-limit-exceeded')}
              disabled={!activeTwin || activatingError}
              className={`py-2 px-3 text-left rounded-lg text-xs font-bold transition border ${
                currentErrorType === 'daily-limit-exceeded'
                  ? 'bg-purple-50 border-purple-300 text-purple-800'
                  : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700'
              }`}
            >
              🟣 403 Daily Limit Exceeded
            </button>
            <button
              onClick={() => onSetErrorMode('invalid-api-key')}
              disabled={!activeTwin || activatingError}
              className={`py-2 px-3 text-left rounded-lg text-xs font-bold transition border ${
                currentErrorType === 'invalid-api-key'
                  ? 'bg-purple-50 border-purple-300 text-purple-800'
                  : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700'
              }`}
            >
              🟣 400 Invalid API Key
            </button>
            <button
              onClick={() => onSetErrorMode('empty-results')}
              disabled={!activeTwin || activatingError}
              className={`py-2 px-3 text-left rounded-lg text-xs font-bold transition border ${
                currentErrorType === 'empty-results'
                  ? 'bg-purple-50 border-purple-300 text-purple-800'
                  : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700'
              }`}
            >
              🟣 200 Empty Search Results
            </button>
          </div>
        </div>

        <div className="space-y-1.5 pt-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
            Player Errors (Shim)
          </span>
          <div className="grid grid-cols-2 gap-2">
            {[2, 5, 100, 101, 150].map((code) => {
              const modeType = `player-error-${code}`;
              return (
                <button
                  key={code}
                  onClick={() => onSetErrorMode(modeType)}
                  disabled={!activeTwin || activatingError}
                  className={`py-2 px-2 text-center rounded-lg text-xs font-bold transition border ${
                    currentErrorType === modeType
                      ? 'bg-purple-50 border-purple-300 text-purple-800'
                      : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700'
                  }`}
                >
                  Error Code {code}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
