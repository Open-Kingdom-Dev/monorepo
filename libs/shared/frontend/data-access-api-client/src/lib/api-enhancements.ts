import { api } from './demo-scaffold-backend/api';

api.enhanceEndpoints({
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
