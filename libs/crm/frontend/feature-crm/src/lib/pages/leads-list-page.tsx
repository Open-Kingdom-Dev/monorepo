import { useNavigate } from 'react-router';
import { DataGrid } from '@open-kingdom/shared-frontend-ui-datagrid';
import { useLeadsControllerFindAllQuery } from '@open-kingdom/shared-frontend-data-access-api-client';

import { PageHeader } from '../components/page-header';

const columnDefs = [
  { field: 'name', headerName: 'Name', sortable: true, filter: true, flex: 1 },
  { field: 'companyName', headerName: 'Company' },
  { field: 'email', headerName: 'Email' },
  { field: 'phone', headerName: 'Phone' },
  { field: 'source', headerName: 'Source' },
  { field: 'status', headerName: 'Status' },
];

const EMPTY_FILTER = {
  ownerId: undefined,
  status: undefined,
  search: undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

export function LeadsListPage() {
  const leads = useLeadsControllerFindAllQuery(EMPTY_FILTER);
  const navigate = useNavigate();
  return (
    <div className="flex h-full flex-col gap-4">
      <PageHeader
        title="Leads"
        subtitle="New prospects not yet qualified. Click a row to review and convert."
      />
      <div className="h-[28rem]">
        <DataGrid
          columnDefs={columnDefs}
          rowData={leads.data ?? []}
          enableStatePersistence
          storageKey="crm-leads-grid"
          onRowClicked={(event) => {
            const id = (event.data as { id?: number } | undefined)?.id;
            if (typeof id === 'number') navigate(`/crm/leads/${id}`);
          }}
        />
      </div>
    </div>
  );
}
