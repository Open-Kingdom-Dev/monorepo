import { baseApi } from './baseApi';

// Adds cache invalidation tags to generated role-mutation endpoints.
// Imported as a side-effect in this library's index.ts so RTK Query
// automatically refetches 'Authentication' and 'Users' queries after role changes.
baseApi.enhanceEndpoints({
  endpoints: {
    userRolesControllerSetRoles: {
      invalidatesTags: ['Authentication', 'Users'],
    },
    userRolesControllerAssignRole: {
      invalidatesTags: ['Authentication', 'Users'],
    },
    userRolesControllerRemoveRole: {
      invalidatesTags: ['Authentication', 'Users'],
    },
  },
});
