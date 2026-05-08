# `@open-kingdom/crm-frontend-feature-crm`

The CRM frontend — a React Router route table plus six page components and a lead-conversion modal, all wired against the auto-generated RTK Query hooks in `shared-frontend-data-access-api-client`. A host application splices `crmRoutes` into its router and renders `crmNavEntries` wherever it puts navigation; everything else (data fetching, state, theming) wires itself up.

This library is composed of presentational pages built on the shared `ui-primitives`, `ui-datagrid`, `ui-stage-board`, `ui-record-detail`, and `ui-activity-timeline` libraries — it owns no UI primitives of its own.

---

## Exports

### Routing

| Export          | Type                     | Description                                                                                                                  |
| --------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `crmRoutes`     | `RouteObject[]`          | React Router route tree rooted at `/crm`. Splice this into your application router as a child route.                         |
| `crmNavEntries` | `readonly CrmNavEntry[]` | Declarative nav entries the host can render however it wants. Five entries: Dashboard, Contacts, Companies, Leads, Pipeline. |
| `CrmNavEntry`   | `interface`              | `{ path: string; label: string }`.                                                                                           |

### Pages

| Export                      | Type      | Mounted at           |
| --------------------------- | --------- | -------------------- |
| `CrmDashboardPage`          | component | `/crm` (index)       |
| `ContactsListPage`          | component | `/crm/contacts`      |
| `CompaniesListPage`         | component | `/crm/companies`     |
| `LeadsListPage`             | component | `/crm/leads`         |
| `LeadDetailPage`            | component | `/crm/leads/:id`     |
| `OpportunitiesPipelinePage` | component | `/crm/opportunities` |

Pages are exported individually so they can be reused outside the bundled route table (e.g. embedded in a custom layout).

### Components

| Export             | Type      | Description                                                                                                 |
| ------------------ | --------- | ----------------------------------------------------------------------------------------------------------- |
| `ConvertLeadModal` | component | Modal dialog for converting a lead. Wraps `useLeadConversionControllerConvertMutation` from the API client. |

`ConvertLeadModalProps`:

| Property       | Type                      | Required | Description                                                    |
| -------------- | ------------------------- | -------- | -------------------------------------------------------------- |
| `leadId`       | `number`                  | Yes      | Lead to convert.                                               |
| `defaultTitle` | `string`                  | No       | Initial value for the opportunity title input.                 |
| `open`         | `boolean`                 | Yes      | Controlled-open state.                                         |
| `onOpenChange` | `(open: boolean) => void` | Yes      | Controlled-open setter.                                        |
| `onConverted`  | `() => void`              | No       | Fired after a successful conversion. Use to refetch list data. |

---

## Route Tree

```
/crm                    CrmLayout (renders <Outlet/> + nav strip)
├── /                   CrmDashboardPage
├── /contacts           ContactsListPage
├── /companies          CompaniesListPage
├── /leads              LeadsListPage
├── /leads/:id          LeadDetailPage
└── /opportunities      OpportunitiesPipelinePage
```

`CrmLayout` is internal — it renders a thin nav strip across the top using `crmNavEntries` plus a React Router `<Outlet />`. Host apps that want their own chrome should consume the page components directly.

---

## Wiring into a Host Application

### Splice the routes into the app router

```tsx
// apps/your-app/app/routes.tsx
import { crmRoutes } from '@open-kingdom/crm-frontend-feature-crm';

export const routes = [
  {
    path: '/',
    element: <RootLayout />,
    children: [{ index: true, element: <Dashboard /> }, { path: 'admin', element: <AdminPage /> }, ...crmRoutes],
  },
];
```

### Render the nav entries

```tsx
import { crmNavEntries } from '@open-kingdom/crm-frontend-feature-crm';
import { NavLink } from 'react-router';

export function AppNav() {
  return (
    <nav>
      {crmNavEntries.map((entry) => (
        <NavLink key={entry.path} to={entry.path}>
          {entry.label}
        </NavLink>
      ))}
    </nav>
  );
}
```

### Required peer dependencies

The host application is expected to provide all of:

- `react`, `react-dom` (`^19.0.0`)
- `react-router` (`^7.2.0`)
- `react-redux` (`^9.2.0`) — for the API client store middleware
- `@open-kingdom/shared-frontend-ui-theme` — provides Tailwind palette and `cn()`
- `@open-kingdom/shared-frontend-ui-primitives` — `Button`, `Dialog`, `Tabs`, etc.
- `@open-kingdom/shared-frontend-ui-datagrid` — list pages render `<DataGrid />`
- `@open-kingdom/shared-frontend-ui-stage-board` — pipeline page renders `<StageBoard />`
- `@open-kingdom/shared-frontend-ui-record-detail` — lead-detail page renders `<RecordDetail />`
- `@open-kingdom/shared-frontend-ui-activity-timeline` — lead-detail page renders `<ActivityTimeline />`
- `@open-kingdom/shared-frontend-data-access-api-client` — supplies the RTK Query hooks
- `@open-kingdom/crm-poly-util-domain` — domain types used in props

These are declared as `peerDependencies` in `package.json`. The host's Tailwind config must include this library's source files in its `content` glob so the palette classes used here are emitted.

---

## API Client Hooks

This library calls the auto-generated RTK Query hooks from `shared-frontend-data-access-api-client` (regenerated from the backend OpenAPI spec via `npm run client:generate-all`). The relevant endpoint groups:

- `useContactsControllerFindAllQuery`, `useContactsControllerCreateMutation`, …
- `useCompaniesControllerFindAllQuery`, …
- `useLeadsControllerFindAllQuery`, `useLeadsControllerFindOneQuery`, …
- `useOpportunitiesControllerFindAllQuery`, `useOpportunitiesControllerPipelineSummaryQuery`, `useOpportunitiesControllerCloseMutation`, …
- `useActivityLogControllerFindAllQuery`, `useActivityLogControllerCreateMutation`, …
- `useDashboardControllerSnapshotQuery`
- `useLeadConversionControllerConvertMutation`

If you regenerate the API client and the names drift, the pages will fail to compile — re-run `npm run client:generate-all` after every backend controller change.

---

## Testing

```bash
nx test crm-frontend-feature-crm
```

The test suite currently covers the route table shape (`routes.spec.ts`).
