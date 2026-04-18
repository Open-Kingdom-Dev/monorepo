import { DataGrid } from '@open-kingdom/shared-frontend-ui-datagrid';
import { useCompaniesControllerFindAllQuery } from '@open-kingdom/shared-frontend-data-access-api-client';

import { PageHeader } from '../components/page-header';

const columnDefs = [
  { field: 'name', headerName: 'Name', sortable: true, filter: true, flex: 1 },
  { field: 'industry', headerName: 'Industry', sortable: true, filter: true },
  { field: 'website', headerName: 'Website' },
  { field: 'primaryPhone', headerName: 'Phone' },
  { field: 'location', headerName: 'Location' },
  { field: 'status', headerName: 'Status' },
];

const EMPTY_FILTER = {
  ownerId: undefined,
  status: undefined,
  search: undefined,
  includeArchived: undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

export function CompaniesListPage() {
  const companies = useCompaniesControllerFindAllQuery(EMPTY_FILTER);
  return (
    <div className="flex h-full flex-col gap-4">
      <PageHeader
        title="Companies"
        subtitle="Organizations you interact with."
      />
      <div className="h-[28rem]">
        <DataGrid
          columnDefs={columnDefs}
          rowData={companies.data ?? []}
          enableStatePersistence
          storageKey="crm-companies-grid"
        />
      </div>
    </div>
  );
}
