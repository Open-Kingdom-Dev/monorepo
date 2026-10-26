import { usePortLeaseControllerGetStatusQuery } from '@open-kingdom/shared-frontend-data-access-api-client';

const SOURCE_LABEL = {
  registry: 'leased from the registry',
  cache: 'inherited from the parent process',
  degraded: 'degraded — not a git worktree',
} as const;

export default function PortLeaseDemo() {
  const {
    data: lease,
    isLoading,
    isFetching,
    error,
    refetch,
  } = usePortLeaseControllerGetStatusQuery();

  if (isLoading) {
    return <p className="p-8 text-muted-foreground">Leasing a slot…</p>;
  }

  if (error || !lease) {
    return (
      <div className="p-8 space-y-2" data-testid="port-lease-error">
        <p className="text-destructive">Could not load the port lease.</p>
        <button
          onClick={() => refetch()}
          className="text-sm underline"
          data-testid="port-lease-retry"
        >
          Retry
        </button>
      </div>
    );
  }

  const backend = lease.ports.find((p) => p.name === 'PORT');
  const backendOnLease = backend?.leased === lease.backendPort;

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">
          Worktree Port Lease
        </h1>
        <p className="text-sm text-muted-foreground">
          Each git worktree of this repo leases a small integer — a slot — and
          every port its stack needs is <code>base + slot × width</code>. The
          backend resolved this lease live, for the checkout it is running in.
        </p>
      </header>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Stat id="slot" label="Slot" value={String(lease.slot)} />
        <Stat id="width" label="Width" value={String(lease.width)} />
        <Stat
          id="primary"
          label="Primary"
          value={lease.isPrimary ? 'yes' : 'no'}
        />
        <Stat id="branch" label="Branch" value={lease.branch ?? '—'} />
      </section>

      <p
        className="text-sm text-muted-foreground"
        data-testid="port-lease-source"
      >
        Slot {lease.slot}, {SOURCE_LABEL[lease.source]}
        {lease.worktreePath && (
          <>
            {' '}
            · <code>{lease.worktreePath}</code>
          </>
        )}
      </p>

      {!backendOnLease && backend && (
        <p
          className="rounded-md border border-border bg-muted p-3 text-sm"
          data-testid="port-lease-mismatch"
        >
          This backend is listening on {lease.backendPort}; the lease would give
          it {backend.leased}. The demo stack is not wired to the lease yet, so
          it still uses its fixed ports.
        </p>
      )}

      <section className="space-y-2">
        <h2 className="font-semibold text-foreground">Ports for this slot</h2>
        <table className="w-full text-sm border border-border">
          <thead className="bg-muted text-left">
            <tr>
              <th className="p-2">Service</th>
              <th className="p-2">Base (slot 0)</th>
              <th className="p-2">Leased</th>
              <th className="p-2">Listening now</th>
            </tr>
          </thead>
          <tbody>
            {lease.ports.map((port) => (
              <tr
                key={port.name}
                className="border-t border-border"
                data-testid={`port-lease-row-${port.name}`}
              >
                <td className="p-2 font-mono">{port.name}</td>
                <td className="p-2 font-mono" data-testid="base">
                  {port.base}
                </td>
                <td className="p-2 font-mono" data-testid="leased">
                  {port.leased}
                </td>
                <td
                  data-testid="busy"
                  className={
                    port.busy ? 'p-2 text-success' : 'p-2 text-muted-foreground'
                  }
                >
                  {port.busy ? 'yes' : 'no'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-foreground">
          Slots leased in this clone
        </h2>
        {lease.registry.length === 0 ? (
          <p className="text-sm text-muted-foreground">No registry.</p>
        ) : (
          <ul className="text-sm space-y-1">
            {lease.registry.map((entry) => (
              <li
                key={entry.slot}
                className="font-mono"
                data-testid={`port-lease-registry-${entry.slot}`}
              >
                {entry.slot} · {entry.branch || '(detached)'} · {entry.path}
                {entry.current && (
                  <span className="ml-2 font-sans font-semibold">← this</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {lease.warnings.length > 0 && (
        <ul
          className="text-sm text-destructive list-disc pl-5"
          data-testid="port-lease-warnings"
        >
          {lease.warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      )}

      <button
        onClick={() => refetch()}
        disabled={isFetching}
        data-testid="port-lease-refresh"
        className="rounded-md border border-border px-3 py-1.5 text-sm disabled:opacity-50"
      >
        {isFetching ? 'Refreshing…' : 'Refresh'}
      </button>
    </div>
  );
}

function Stat({
  id,
  label,
  value,
}: {
  id: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className="text-lg font-semibold text-foreground truncate"
        data-testid={`port-lease-${id}`}
      >
        {value}
      </div>
    </div>
  );
}
