import * as React from 'react';
import { StageBoard } from '@open-kingdom/shared-frontend-ui-stage-board';
import {
  useOpportunitiesControllerFindAllQuery,
  useOpportunitiesControllerUpdateMutation,
  useConfigurableLookupsControllerFindAllQuery,
} from '@open-kingdom/shared-frontend-data-access-api-client';
import { LOOKUP_LIST_KEYS } from '@open-kingdom/shared-poly-util-crm-domain';
import { cn } from '@open-kingdom/shared-frontend-ui-theme';

import { PageHeader } from '../components/page-header';

const currency = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

type OpportunityRow = {
  id: number;
  title: string;
  stage: string;
  estimatedValue?: number | null;
  companyId: number;
  expectedCloseDate?: string | null;
};

// The generated API types mark every query param as required even when the
// controller treats them as optional; pass fully-populated objects.
const STAGES_FILTER = {
  listKey: LOOKUP_LIST_KEYS.OPPORTUNITY_STAGE,
  includeInactive: undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;
const OPPS_FILTER = {
  ownerId: undefined,
  companyId: undefined,
  stage: undefined,
  search: undefined,
  openOnly: undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

export function OpportunitiesPipelinePage() {
  const stages = useConfigurableLookupsControllerFindAllQuery(STAGES_FILTER);
  const opps = useOpportunitiesControllerFindAllQuery(OPPS_FILTER);
  const [updateOpp] = useOpportunitiesControllerUpdateMutation();

  const columns = React.useMemo(() => {
    const data = stages.data ?? [];
    const sorted = [...data].sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
    );
    return sorted.map((s) => ({
      id: s.value,
      label: s.label,
    }));
  }, [stages.data]);

  const rows = (opps.data ?? []) as OpportunityRow[];

  return (
    <div className="flex h-full flex-col gap-4">
      <PageHeader
        title="Pipeline"
        subtitle="Drag opportunities between stages to update them."
      />
      {columns.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Pipeline stages not loaded yet.
        </p>
      ) : (
        <StageBoard
          columns={columns}
          cards={rows}
          getCardId={(o) => String(o.id)}
          getCardColumnId={(o) => o.stage}
          renderCard={(o) => (
            <div className="flex flex-col gap-1 p-3">
              <p className="truncate text-sm font-medium text-foreground">
                {o.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {o.estimatedValue
                  ? currency.format(o.estimatedValue)
                  : 'No estimate'}
              </p>
              {o.expectedCloseDate && (
                <p
                  className={cn(
                    'text-xs',
                    new Date(o.expectedCloseDate).getTime() < Date.now()
                      ? 'text-destructive'
                      : 'text-muted-foreground'
                  )}
                >
                  Close: {new Date(o.expectedCloseDate).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
          onCardMoved={async ({ cardId, toColumnId }) => {
            await updateOpp({
              id: Number(cardId),
              updateOpportunityDto: {
                // Stage is user-configurable at runtime; the generated client
                // uses a strict literal union from the snapshot taken at
                // codegen time, so cast to keep the door open for new stages.
                stage: toColumnId as never,
              },
            }).unwrap();
          }}
        />
      )}
    </div>
  );
}
