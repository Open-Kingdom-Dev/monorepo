import type { BaseQueryFn, EndpointBuilder } from '@reduxjs/toolkit/query';
import type {
  InviteUserDto,
  AcceptInvitationDto,
  CreateRoleDto,
} from '../types';

// Endpoint definitions for user management
export const createUserManagementEndpoints = (
  build: EndpointBuilder<BaseQueryFn, string, string>
) => ({
  // Users
  listUsers: build.query({
    query: () => '/api/users',
  }),

  deleteUser: build.mutation({
    query: (id: number) => ({
      url: `/api/users/${id}`,
      method: 'DELETE',
    }),
  }),

  inviteUser: build.mutation({
    query: (dto: InviteUserDto) => ({
      url: '/api/users/invite',
      method: 'POST',
      body: dto,
    }),
  }),

  // Invitations (public endpoints)
  validateInvitation: build.query({
    query: (token: string) =>
      `/api/invitations/validate/${encodeURIComponent(token)}`,
  }),

  acceptInvitation: build.mutation({
    query: (dto: AcceptInvitationDto) => ({
      url: '/api/invitations/accept',
      method: 'POST',
      body: dto,
    }),
  }),

  // Custom Roles
  listRoles: build.query({
    query: () => '/api/roles',
  }),

  createRole: build.mutation({
    query: (dto: CreateRoleDto) => ({
      url: '/api/roles',
      method: 'POST',
      body: dto,
    }),
  }),

  deleteRole: build.mutation({
    query: (id: number) => ({
      url: `/api/roles/${id}`,
      method: 'DELETE',
    }),
  }),
});
