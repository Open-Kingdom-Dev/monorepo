import * as React from 'react';
import { useNavigate, useParams } from 'react-router';
import { Badge, Button } from '@open-kingdom/shared-frontend-ui-primitives';
import { RecordDetail } from '@open-kingdom/shared-frontend-ui-record-detail';
import {
  ActivityTimeline,
  type ActivityTimelineEntry,
} from '@open-kingdom/shared-frontend-ui-activity-timeline';
import {
  useLeadsControllerFindOneQuery,
  useActivityLogControllerFindAllQuery,
} from '@open-kingdom/shared-frontend-data-access-api-client';
import {
  isTerminalLeadStatus,
  type ActivityType,
  type LeadStatus,
} from '@open-kingdom/crm-poly-util-domain';

import { ConvertLeadModal } from '../components/convert-lead-modal';
import {
  CRM_ACTIVITY_ICON_MAP,
  CRM_ACTIVITY_LABEL_MAP,
} from '../activity-icons';

interface ActivityRow {
  id: number;
  type: string;
  subject: string;
  description?: string | null | object;
  createdAt: string;
  dueAt?: string | null;
  completedAt?: string | null;
}

const str = (v: unknown): string | null =>
  typeof v === 'string' && v.length > 0 ? v : null;

function toTimelineEntry(a: ActivityRow): ActivityTimelineEntry<ActivityType> {
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

export function LeadDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const leadId = Number(id);
  const lead = useLeadsControllerFindOneQuery({ id: leadId });
  const activities = useActivityLogControllerFindAllQuery({
    relatedType: 'lead',
    relatedId: leadId,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
  const [modalOpen, setModalOpen] = React.useState(false);

  if (lead.isLoading) {
    return <p className="p-4 text-sm text-muted-foreground">Loading lead…</p>;
  }
  if (!lead.data) {
    return (
      <p className="p-4 text-sm text-muted-foreground">
        Lead not found.{' '}
        <button className="underline" onClick={() => navigate('/crm/leads')}>
          Back to leads
        </button>
      </p>
    );
  }

  const l = lead.data;
  const status = l.status as LeadStatus;
  const alreadyConverted = Boolean(l.convertedAt);
  const canConvert = !alreadyConverted && !isTerminalLeadStatus(status);

  return (
    <>
      <RecordDetail
        title={l.name}
        subtitle={str(l.companyName) ?? 'No company provided'}
        statusSlot={
          <div className="flex items-center gap-2">
            <Badge variant={alreadyConverted ? 'default' : 'secondary'}>
              {alreadyConverted ? 'converted' : status}
            </Badge>
            {str(l.source) && (
              <span className="text-xs text-muted-foreground">
                via {str(l.source)}
              </span>
            )}
          </div>
        }
        nextActionSlot={
          alreadyConverted ? (
            <span className="text-muted-foreground">
              Converted on{' '}
              {new Date(l.convertedAt as string).toLocaleDateString()}
            </span>
          ) : (
            'Review lead and decide whether to qualify or disqualify.'
          )
        }
        actionsSlot={
          <>
            <Button variant="outline" onClick={() => navigate('/crm/leads')}>
              Back
            </Button>
            <Button disabled={!canConvert} onClick={() => setModalOpen(true)}>
              Convert
            </Button>
          </>
        }
        tabs={[
          {
            id: 'overview',
            label: 'Overview',
            content: (
              <dl className="grid gap-3 p-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase text-muted-foreground">
                    Email
                  </dt>
                  <dd>{str(l.email) ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-muted-foreground">
                    Phone
                  </dt>
                  <dd>{str(l.phone) ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-muted-foreground">
                    Company
                  </dt>
                  <dd>{str(l.companyName) ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-muted-foreground">
                    Source
                  </dt>
                  <dd>{str(l.source) ?? '—'}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs uppercase text-muted-foreground">
                    Notes
                  </dt>
                  <dd className="whitespace-pre-wrap">{str(l.notes) ?? '—'}</dd>
                </div>
              </dl>
            ),
          },
          {
            id: 'activity',
            label: 'Activity',
            content: (
              <div className="p-2">
                <ActivityTimeline
                  entries={((activities.data ?? []) as ActivityRow[]).map(
                    toTimelineEntry
                  )}
                  iconMap={CRM_ACTIVITY_ICON_MAP}
                  labelMap={CRM_ACTIVITY_LABEL_MAP}
                  emptyState="No activity logged on this lead yet."
                />
              </div>
            ),
          },
        ]}
      />

      <ConvertLeadModal
        leadId={leadId}
        defaultTitle={
          str(l.companyName) ? `${str(l.companyName)} — ${l.name}` : l.name
        }
        open={modalOpen}
        onOpenChange={setModalOpen}
        onConverted={() => lead.refetch()}
      />
    </>
  );
}
