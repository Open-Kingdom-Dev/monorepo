import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@open-kingdom/shared-frontend-ui-primitives';
import { cn } from '@open-kingdom/shared-frontend-ui-theme';

export interface RecordDetailTab {
  id: string;
  label: string;
  content: React.ReactNode;
  disabled?: boolean;
}

export interface RecordDetailProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  statusSlot?: React.ReactNode;
  nextActionSlot?: React.ReactNode;
  actionsSlot?: React.ReactNode;
  tabs: ReadonlyArray<RecordDetailTab>;
  defaultTabId?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

export function RecordDetail({
  title,
  subtitle,
  statusSlot,
  nextActionSlot,
  actionsSlot,
  tabs,
  defaultTabId,
  value,
  onValueChange,
  className,
}: RecordDetailProps) {
  if (tabs.length === 0) {
    throw new Error('RecordDetail requires at least one tab');
  }
  const initialTabId = defaultTabId ?? tabs[0].id;

  return (
    <div
      className={cn('flex flex-col gap-4', className)}
      data-testid="record-detail"
    >
      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate">{title}</CardTitle>
            {subtitle && <CardDescription>{subtitle}</CardDescription>}
          </div>
          {actionsSlot && (
            <div className="flex shrink-0 items-center gap-2">{actionsSlot}</div>
          )}
        </CardHeader>
        {(statusSlot || nextActionSlot) && (
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {statusSlot && (
              <section
                className="rounded-md border border-border bg-muted/40 p-3"
                data-testid="record-detail-status"
              >
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Status
                </p>
                <div className="mt-1 text-sm font-medium text-foreground">
                  {statusSlot}
                </div>
              </section>
            )}
            {nextActionSlot && (
              <section
                className="rounded-md border border-border bg-muted/40 p-3"
                data-testid="record-detail-next-action"
              >
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Next action
                </p>
                <div className="mt-1 text-sm text-foreground">{nextActionSlot}</div>
              </section>
            )}
          </CardContent>
        )}
      </Card>

      <Tabs
        defaultValue={value === undefined ? initialTabId : undefined}
        value={value}
        onValueChange={onValueChange}
      >
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} disabled={tab.disabled}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((tab) => (
          <TabsContent
            key={tab.id}
            value={tab.id}
            data-testid={`record-detail-tab-${tab.id}`}
          >
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
