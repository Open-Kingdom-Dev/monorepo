import { DataGrid } from '@open-kingdom/shared-frontend-ui-datagrid';
import { useContactsControllerFindAllQuery } from '@open-kingdom/shared-frontend-data-access-api-client';

import { PageHeader } from '../components/page-header';

const columnDefs = [
  { field: 'lastName', headerName: 'Last name', sortable: true, filter: true },
  {
    field: 'firstName',
    headerName: 'First name',
    sortable: true,
    filter: true,
  },
  { field: 'email', headerName: 'Email', sortable: true, filter: true },
  { field: 'phone', headerName: 'Phone' },
  { field: 'jobTitle', headerName: 'Title' },
  { field: 'status', headerName: 'Status' },
];

const EMPTY_FILTER = {
  ownerId: undefined,
  companyId: undefined,
  status: undefined,
  search: undefined,
  includeArchived: undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

export function ContactsListPage() {
  const contacts = useContactsControllerFindAllQuery(EMPTY_FILTER);
  return (
    <div className="flex h-full flex-col gap-4">
      <PageHeader
        title="Contacts"
        subtitle="People you know or may do business with."
      />
      <div className="h-[28rem]">
        <DataGrid
          columnDefs={columnDefs}
          rowData={contacts.data ?? []}
          enableStatePersistence
          storageKey="crm-contacts-grid"
        />
      </div>
    </div>
  );
}
