import { useAuthControllerGetProfileQuery } from '@open-kingdom/shared-frontend-data-access-api-client';
import {
  UserList,
  InvitationList,
} from '@open-kingdom/shared-frontend-feature-user-management';

export default function UserManagement() {
  const { data: profile } = useAuthControllerGetProfileQuery();

  return (
    <div className="flex flex-col gap-y-8">
      <UserList currentUserId={profile?.id} />
      <InvitationList />
    </div>
  );
}
