// App-level schema composition
// Import and re-export all schemas used by this app

export { users } from '@open-kingdom/shared-backend-data-access-users';
export {
  roles,
  permissions,
  rolePermissions,
  invitations,
  userRoles,
} from '@open-kingdom/shared-backend-feature-user-management';
export { configurableLookups } from '@open-kingdom/shared-backend-data-access-configurable-lookups';
export { activityLog } from '@open-kingdom/shared-backend-data-access-activity-log';
export {
  companies,
  contacts,
} from '@open-kingdom/shared-backend-data-access-contacts';
export {
  leads,
  opportunities,
} from '@open-kingdom/shared-backend-data-access-opportunities';
