/* eslint-disable jsx-a11y/accessible-emoji */
import { ApiLogEntry } from '../../routes/use-youtube-demo';

interface YoutubeApiInspectorProps {
  apiLogs: ApiLogEntry[];
  activeLog: ApiLogEntry | undefined;
  selectedLogId: string | null;
  onSelectLogId: (id: string | null) => void;
  onClearConsole: () => void;
  onCopyToClipboard: () => void;
  copied: boolean;
}

export function YoutubeApiInspector({
  apiLogs,
  activeLog,
  selectedLogId,
  onSelectLogId,
  onClearConsole,
  onCopyToClipboard,
  copied,
}: YoutubeApiInspectorProps) {
  return (
    <div className="border rounded-xl bg-white shadow-sm overflow-hidden mt-8 border-gray-200">
      <div className="border-b px-6 py-4 flex items-center justify-between bg-gray-50">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🛠️</span>
          <div>
            <h3 className="font-bold text-gray-900 text-base">
              YouTube API Inspector
            </h3>
            <p className="text-xs text-gray-500">
              Live request and response logging for simulated YouTube API
              endpoints
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onClearConsole}
            className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 font-semibold transition bg-white shadow-sm"
          >
            Clear Console
          </button>
        </div>
      </div>

      {apiLogs.length === 0 ? (
        <div className="p-16 text-center text-gray-400 text-sm font-medium flex flex-col items-center justify-center space-y-2">
          <span className="text-3xl">📥</span>
          <span>
            No API actions recorded yet. Try booting the twin, searching, or
            triggering an error above!
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-gray-200 min-h-[400px]">
          {/* Left panel: List of requests */}
          <div className="lg:col-span-1 overflow-y-auto max-h-[400px] divide-y divide-gray-100 bg-white">
            {apiLogs.map((log) => {
              const isSelected = selectedLogId === log.id;
              const methodColors =
                log.method === 'GET'
                  ? 'bg-sky-50 text-sky-700 border-sky-200'
                  : log.method === 'POST'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : log.method === 'DELETE'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : log.method === 'PLAY'
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : 'bg-red-50 text-red-700 border-red-200'; // ERROR

              const statusColors =
                log.status >= 200 && log.status < 300 && log.method !== 'ERROR'
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : log.method === 'ERROR' || log.status >= 400
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200';

              return (
                <button
                  key={log.id}
                  onClick={() => onSelectLogId(log.id)}
                  className={`w-full p-4 text-left flex items-start justify-between gap-3 hover:bg-slate-50 transition-colors border-l-4 ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/20'
                      : 'border-transparent'
                  }`}
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border uppercase tracking-wider ${methodColors}`}
                      >
                        {log.method}
                      </span>
                      <code className="text-xs font-mono font-semibold text-gray-700 truncate block">
                        {log.url.split('?')[0]}
                      </code>
                    </div>
                    <div className="text-[10px] text-gray-400 font-medium">
                      {log.timestamp}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${statusColors}`}
                  >
                    {log.status}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right panel: Active request details & Response JSON */}
          {activeLog && (
            <div className="lg:col-span-2 p-6 bg-slate-950 text-slate-200 font-mono text-xs flex flex-col h-[400px]">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-shrink-0">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-slate-400 font-bold uppercase">
                      {activeLog.method}
                    </span>
                    <code className="text-slate-100 font-bold break-all">
                      {activeLog.url}
                    </code>
                  </div>
                  <div className="text-slate-400 text-[10px]">
                    Response Status:{' '}
                    <span
                      className={
                        activeLog.status >= 200 &&
                        activeLog.status < 300 &&
                        activeLog.method !== 'ERROR'
                          ? 'text-green-400 font-bold'
                          : 'text-rose-400 font-bold'
                      }
                    >
                      {activeLog.status} {activeLog.statusText}
                    </span>
                  </div>
                </div>
                <button
                  onClick={onCopyToClipboard}
                  className="ml-4 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 font-sans font-medium text-[11px] transition flex items-center gap-1.5 whitespace-nowrap shadow-sm"
                >
                  {copied ? (
                    <>
                      <span className="text-green-400">✓</span> Copied
                    </>
                  ) : (
                    <>
                      <span>📋</span> Copy JSON
                    </>
                  )}
                </button>
              </div>

              <div className="flex-1 overflow-auto mt-4 p-4 rounded-lg bg-slate-900/50 border border-slate-900">
                <pre className="text-emerald-400 font-mono text-xs leading-relaxed whitespace-pre-wrap word-break-all">
                  {JSON.stringify(activeLog.response, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
