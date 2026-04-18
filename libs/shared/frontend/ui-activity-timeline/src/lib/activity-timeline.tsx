import * as React from 'react';
import {
  CheckCircle2,
  Circle,
  FileText,
  Mail,
  Phone,
  StickyNote,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@open-kingdom/shared-frontend-ui-theme';
import type { ActivityType } from '@open-kingdom/shared-poly-util-crm-domain';

export interface ActivityTimelineEntry {
  id: string | number;
  type: ActivityType;
  subject: string;
  description?: string | null;
  timestamp: Date;
  dueAt?: Date | null;
  completedAt?: Date | null;
  ownerLabel?: string;
}

export interface ActivityTimelineProps {
  entries: ReadonlyArray<ActivityTimelineEntry>;
  className?: string;
  emptyState?: React.ReactNode;
  formatTimestamp?: (date: Date) => string;
}

const TYPE_ICONS: Record<ActivityType, LucideIcon> = {
  note: StickyNote,
  call: Phone,
  meeting: Users,
  email: Mail,
  task: FileText,
};

const TYPE_LABELS: Record<ActivityType, string> = {
  note: 'Note',
  call: 'Call',
  meeting: 'Meeting',
  email: 'Email',
  task: 'Task',
};

function defaultFormatTimestamp(date: Date): string {
  return date.toLocaleString();
}

export const ActivityTimeline = React.forwardRef<
  HTMLOListElement,
  ActivityTimelineProps
>(function ActivityTimeline(
  { entries, className, emptyState, formatTimestamp = defaultFormatTimestamp },
  ref
) {
  if (entries.length === 0) {
    return (
      <div
        className={cn(
          'rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground',
          className
        )}
        data-testid="activity-timeline-empty"
      >
        {emptyState ?? 'No activity yet.'}
      </div>
    );
  }

  return (
    <ol ref={ref} className={cn('space-y-3', className)} data-testid="activity-timeline">
      {entries.map((entry) => {
        const Icon = TYPE_ICONS[entry.type];
        const isPlanned = Boolean(entry.dueAt && !entry.completedAt);
        const isOverdue =
          isPlanned && entry.dueAt ? entry.dueAt.getTime() < Date.now() : false;
        const primaryTimestamp = entry.completedAt ?? entry.dueAt ?? entry.timestamp;

        return (
          <li
            key={entry.id}
            className={cn(
              'flex gap-3 rounded-md border border-border bg-card p-3',
              isOverdue && 'border-destructive/60'
            )}
            data-testid={`activity-timeline-item-${entry.id}`}
          >
            <div
              className={cn(
                'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground',
                entry.completedAt && 'bg-primary/10 text-primary',
                isOverdue && 'bg-destructive/10 text-destructive'
              )}
              aria-hidden
            >
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                <p className="truncate text-sm font-medium text-foreground">
                  {entry.subject}
                </p>
                <time className="text-xs text-muted-foreground">
                  {formatTimestamp(primaryTimestamp)}
                </time>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  {entry.completedAt ? (
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                  ) : isPlanned ? (
                    <Circle className="h-3 w-3" />
                  ) : null}
                  {TYPE_LABELS[entry.type]}
                </span>
                {entry.ownerLabel && <span>·</span>}
                {entry.ownerLabel && <span>{entry.ownerLabel}</span>}
                {isOverdue && (
                  <span className="font-medium text-destructive">· Overdue</span>
                )}
              </div>
              {entry.description && (
                <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/80">
                  {entry.description}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
});
