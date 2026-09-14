import {
  Power,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  Server,
} from 'lucide-react';

interface GoogleAuthEmulatorStatusProps {
  status: {
    running: boolean;
    healthy: boolean;
    port: number;
    url?: string;
  } | null;
  loading: boolean;
  starting: boolean;
  stopping: boolean;
  resetting: boolean;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
}

export const GoogleAuthEmulatorStatus: React.FC<
  GoogleAuthEmulatorStatusProps
> = ({
  status,
  loading,
  starting,
  stopping,
  resetting,
  onStart,
  onStop,
  onReset,
}) => {
  const isOnline = status?.running && status?.healthy;

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
        <div className="flex items-center gap-2.5">
          <Server className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">
            Google OAuth Emulator
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {loading ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground animate-pulse">
              Checking...
            </span>
          ) : isOnline ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              Online (Port {status?.port})
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
              <ShieldAlert className="h-3.5 w-3.5" />
              Offline
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm mb-6">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Emulator Service
          </p>
          <p className="font-semibold text-foreground">Vercel Labs Emulate</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Target Endpoint
          </p>
          <p className="font-mono text-xs text-foreground truncate">
            {status?.url || `http://localhost:${status?.port || 9015}`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {!status?.running ? (
          <button
            onClick={onStart}
            disabled={starting}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            <Power className="h-4 w-4" />
            {starting ? 'Starting Emulator...' : 'Start Emulator'}
          </button>
        ) : (
          <button
            onClick={onStop}
            disabled={stopping}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground shadow transition-colors hover:bg-destructive/90 disabled:opacity-50"
          >
            <Power className="h-4 w-4" />
            {stopping ? 'Stopping...' : 'Stop Emulator'}
          </button>
        )}

        <button
          onClick={onReset}
          disabled={resetting || !status?.running}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
          title="Reset seed data and clear API logs"
        >
          <RotateCcw className="h-4 w-4" />
          {resetting ? 'Resetting...' : 'Reset'}
        </button>
      </div>
    </div>
  );
};
