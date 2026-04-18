import { Link } from 'react-router';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@open-kingdom/shared-frontend-ui-primitives';
import {
  useDashboardControllerSnapshotQuery,
  useActivityLogControllerFindAllQuery,
} from '@open-kingdom/shared-frontend-data-access-api-client';
import {
  ActivityTimeline,
  type ActivityTimelineEntry,
} from '@open-kingdom/shared-frontend-ui-activity-timeline';
import { cn } from '@open-kingdom/shared-frontend-ui-theme';
import type { ActivityType } from '@open-kingdom/shared-poly-util-crm-domain';

import { PageHeader } from '../components/page-header';

const currency = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

interface ActivityRow {
  id: number;
  type: string;
  subject: string;
  description?: string | null | object;
  createdAt: string;
  dueAt?: string | null;
  completedAt?: string | null;
}

function toTimelineEntry(a: ActivityRow): ActivityTimelineEntry {
  return {
    id: a.id,
    type: a.type as ActivityType,
    subject: a.subject,
    description: typeof a.description === 'string' ? a.description : null,
    timestamp: new Date(a.createdAt),
    dueAt: a.dueAt ? new Date(a.dueAt) : null,
    completedAt: a.completedAt ? new Date(a.completedAt) : null,
  };
}

// The generated API types mark every query param as required even when the
// controller treats them as optional; pass a fully-populated object.
const OVERDUE_FILTER = {
  relatedType: undefined,
  relatedId: undefined,
  scope: 'overdue',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

export function CrmDashboardPage() {
  const snapshot = useDashboardControllerSnapshotQuery();
  const overdue = useActivityLogControllerFindAllQuery(OVERDUE_FILTER);

  const totalPipelineValue =
    snapshot.data?.pipeline.reduce((sum, s) => sum + s.totalValue, 0) ?? 0;
  const weightedPipelineValue =
    snapshot.data?.pipeline.reduce((sum, s) => sum + s.weightedValue, 0) ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="CRM Dashboard"
        subtitle="Your pipeline, your follow-ups, and what's slipping."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pipeline value</CardDescription>
            <CardTitle>{currency.format(totalPipelineValue)}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Weighted: {currency.format(weightedPipelineValue)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tasks open</CardDescription>
            <CardTitle>{snapshot.data?.tasksOpen ?? 0}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Scheduled follow-ups you own
          </CardContent>
        </Card>
        <Card
          className={cn(
            (snapshot.data?.tasksOverdue ?? 0) > 0 && 'border-destructive/60'
          )}
        >
          <CardHeader className="pb-2">
            <CardDescription>Tasks overdue</CardDescription>
            <CardTitle
              className={cn(
                (snapshot.data?.tasksOverdue ?? 0) > 0 && 'text-destructive'
              )}
            >
              {snapshot.data?.tasksOverdue ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            <Link className="underline" to="/crm/opportunities">
              Review pipeline
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pipeline by stage</CardTitle>
          <CardDescription>
            Counts and totals for each stage in your current pipeline.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {snapshot.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading pipeline…</p>
          ) : (snapshot.data?.pipeline.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">
              No opportunities yet. Add leads and convert them to start.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {snapshot.data?.pipeline.map((s) => (
                <li key={s.stage} className="flex items-center justify-between py-2 text-sm">
                  <span className="capitalize text-foreground">{s.stage}</span>
                  <span className="text-muted-foreground">
                    {s.count} · {currency.format(s.totalValue)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Overdue follow-ups</CardTitle>
          <CardDescription>Tasks you own that are past due.</CardDescription>
        </CardHeader>
        <CardContent>
          <ActivityTimeline
            entries={(overdue.data ?? []).map(toTimelineEntry)}
            emptyState="Nothing overdue. Nice work."
          />
        </CardContent>
      </Card>
    </div>
  );
}
