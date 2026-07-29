import { AppleMusicDemoHook } from './use-apple-music-demo';

interface AppleMusicApiInspectorProps {
  demo: AppleMusicDemoHook;
}

export function AppleMusicApiInspector({ demo }: AppleMusicApiInspectorProps) {
  const {
    apiLogs,
    activeLog,
    selectedLogId,
    setSelectedLogId,
    setApiLogs,
    handleCopyToClipboard,
    copied,
  } = demo;

  return (
    <div className="border rounded-xl bg-white shadow-sm p-5 space-y-4">
      <div className="flex justify-between items-center border-b pb-2">
        <h3 className="font-bold text-gray-900 text-md">Apple Music API Console</h3>
        <button
          onClick={() => {
            setApiLogs([]);
            setSelectedLogId(null);
          }}
          className="text-xs text-red-600 hover:underline"
        >
          Clear Console
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Log List */}
        <div className="border rounded-lg max-h-60 overflow-y-auto divide-y">
          {apiLogs.length === 0 ? (
            <div className="p-4 text-center text-xs text-gray-400">No requests logged yet.</div>
          ) : (
            apiLogs.map((log) => (
              <button
                key={log.id}
                onClick={() => setSelectedLogId(log.id)}
                className={`w-full text-left p-2.5 text-xs transition ${
                  selectedLogId === log.id ? 'bg-red-50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-500">{log.timestamp}</span>
                  <span className={`font-bold ${log.status >= 400 ? 'text-red-600' : 'text-green-600'}`}>
                    {log.status}
                  </span>
                </div>
                <div className="mt-1 font-mono text-[10px] truncate">
                  <span className="font-extrabold text-red-700 mr-1.5">{log.method}</span>
                  {log.url}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Log Detail Code Inspector */}
        <div className="md:col-span-2 border rounded-lg bg-gray-50 p-4 relative flex flex-col max-h-60">
          <div className="flex justify-between items-center mb-2 pb-1 border-b text-xs text-gray-500">
            <span>Inspector Response Payload</span>
            {activeLog && (
              <button onClick={handleCopyToClipboard} className="text-red-600 hover:underline">
                {copied ? 'Copied!' : 'Copy JSON'}
              </button>
            )}
          </div>
          {activeLog ? (
            <pre className="font-mono text-[10px] overflow-auto flex-1 text-gray-800 whitespace-pre-wrap leading-normal">
              {JSON.stringify(activeLog.response, null, 2)}
            </pre>
          ) : (
            <div className="flex items-center justify-center flex-1 text-xs text-gray-400">
              Select a log entry to inspect the payload.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
