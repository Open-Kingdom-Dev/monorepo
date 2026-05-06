import type { RouteObject } from 'react-router';
import { CrmDashboardPage } from './pages/dashboard-page';
import { ContactsListPage } from './pages/contacts-list-page';
import { CompaniesListPage } from './pages/companies-list-page';
import { LeadsListPage } from './pages/leads-list-page';
import { LeadDetailPage } from './pages/lead-detail-page';
import { OpportunitiesPipelinePage } from './pages/opportunities-pipeline-page';
import { CrmLayout } from './components/crm-layout';

/**
 * Route table for the CRM feature. Host applications splice this into their
 * own router. Paths are prefixed with /crm.
 */
export const crmRoutes: RouteObject[] = [
  {
    path: 'crm',
    element: <CrmLayout />,
    children: [
      { index: true, element: <CrmDashboardPage /> },
      { path: 'contacts', element: <ContactsListPage /> },
      { path: 'companies', element: <CompaniesListPage /> },
      { path: 'leads', element: <LeadsListPage /> },
      { path: 'leads/:id', element: <LeadDetailPage /> },
      { path: 'opportunities', element: <OpportunitiesPipelinePage /> },
    ],
  },
];

export interface CrmNavEntry {
  path: string;
  label: string;
}

/**
 * Declarative nav entries the CRM feature contributes. Host applications
 * render these however they want (horizontal bar, sidebar, etc.).
 */
export const crmNavEntries: ReadonlyArray<CrmNavEntry> = [
  { path: '/crm', label: 'Dashboard' },
  { path: '/crm/contacts', label: 'Contacts' },
  { path: '/crm/companies', label: 'Companies' },
  { path: '/crm/leads', label: 'Leads' },
  { path: '/crm/opportunities', label: 'Pipeline' },
];
