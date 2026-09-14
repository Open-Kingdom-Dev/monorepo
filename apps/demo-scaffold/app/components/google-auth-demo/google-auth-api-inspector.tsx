import React, { useState } from 'react';
import {
  Terminal,
  Trash2,
  Copy,
  Check,
  ChevronRight,
  Clock,
  ArrowUpRight,
} from 'lucide-react';

export interface ApiLogEntry {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  statusCode: number;
  requestHeaders: Record<string, string>;
  requestBody?: string;
  responseHeaders: Record<string, string>;
  responseBody: string;
  latencyMs: number;
}

interface GoogleAuthApiInspectorProps {
  logs: ApiLogEntry[];
  onClearLogs: () => void;
}

export const GoogleAuthApiInspector: React.FC<GoogleAuthApiInspectorProps> = ({
  logs,
  onClearLogs,
}) => {
  const [selectedLogId, setSelectedLogId] = useState<string | null>(
    logs.length > 0 ? logs[0].id : null
  );
  const [copied, setCopied] = useState(false);

  const activeLog = logs.find((l) => l.id === selectedLogId) || logs[0];

  const copyLogPayload = () => {
    if (!activeLog) return;
    navigator.clipboard.writeText(JSON.stringify(activeLog, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-muted/40 px-6 py-4">
        <div className="flex items-center gap-2.5">
          <Terminal className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">
            API Request & Response Inspector
          </h2>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            {logs.length} Logged {logs.length === 1 ? 'Call' : 'Calls'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {logs.length > 0 && (
            <>
              <button
                onClick={copyLogPayload}
                className="inline-flex items-center gap-1.5 rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copied ? 'Copied' : 'Copy Log'}
              </button>
              <button
                onClick={onClearLogs}
                className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/20"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear Inspector
              </button>
            </>
          )}
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground space-y-2">
          <Clock className="h-8 w-8 mx-auto opacity-40" />
          <p className="text-sm font-medium">No HTTP API calls captured yet.</p>
          <p className="text-xs text-muted-foreground">
            Perform an OAuth sign-in flow to record and inspect token & userinfo
            traffic.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-border">
          {/* Log List Sidebar */}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-border bg-muted/10">
            {logs.map((log) => {
              const isSelected = log.id === (selectedLogId || activeLog?.id);
              const isSuccess = log.statusCode >= 200 && log.statusCode < 300;
              const isRedirect = log.statusCode >= 300 && log.statusCode < 400;

              return (
                <button
                  key={log.id}
                  onClick={() => setSelectedLogId(log.id)}
                  className={`w-full text-left p-3.5 transition-colors flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-primary/10 border-l-4 border-l-primary'
                      : 'hover:bg-accent/50'
                  }`}
                >
                  <div className="space-y-1 truncate">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                          log.method === 'POST'
                            ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                            : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {log.method}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                          isSuccess
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : isRedirect
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                            : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {log.statusCode}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {log.latencyMs}ms
                      </span>
                    </div>
                    <p className="text-xs font-mono font-medium text-foreground truncate">
                      {log.url.replace(/^http:\/\/localhost:\d+/, '')}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              );
            })}
          </div>

          {/* Active Log Detail Pane */}
          <div className="lg:col-span-2 p-5 space-y-4 max-h-[420px] overflow-y-auto">
            {activeLog && (
              <>
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-foreground">
                        {activeLog.method} {activeLog.url}
                      </span>
                      <a
                        href={activeLog.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </a>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Captured at{' '}
                      {new Date(activeLog.timestamp).toLocaleTimeString()} (
                      {activeLog.latencyMs}ms response time)
                    </p>
                  </div>
                  <span className="text-xs font-mono font-semibold px-2 py-1 rounded bg-muted">
                    HTTP {activeLog.statusCode}
                  </span>
                </div>

                {/* Request Headers & Body */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Request
                  </h4>
                  {activeLog.requestBody && (
                    <div className="space-y-1">
                      <span className="text-[11px] text-muted-foreground">
                        Body:
                      </span>
                      <pre className="p-3 rounded-md bg-slate-950 text-slate-200 text-xs font-mono overflow-x-auto max-h-36">
                        {activeLog.requestBody}
                      </pre>
                    </div>
                  )}
                  <div className="space-y-1">
                    <span className="text-[11px] text-muted-foreground">
                      Headers:
                    </span>
                    <div className="p-2.5 rounded-md bg-muted/40 font-mono text-[11px] space-y-1 border border-border">
                      {Object.entries(activeLog.requestHeaders).map(
                        ([k, v]) => (
                          <div key={k} className="flex justify-between">
                            <span className="text-muted-foreground">{k}:</span>
                            <span className="text-foreground font-medium truncate max-w-md">
                              {v}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>

                {/* Response Payload */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Response Body
                  </h4>
                  <pre className="p-3 rounded-md bg-slate-950 text-emerald-400 text-xs font-mono overflow-x-auto max-h-48 border border-slate-800">
                    {activeLog.responseBody}
                  </pre>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
