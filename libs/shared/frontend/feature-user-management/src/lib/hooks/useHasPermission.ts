import { useAuthControllerGetProfileQuery } from '@open-kingdom/shared-frontend-data-access-api-client';

export function useHasPermission(resource: string, action: string): boolean {
  const { data: profile } = useAuthControllerGetProfileQuery();

  if (!profile?.permissions) return false;

  return profile.permissions.includes(`${resource}:${action}`);
}
