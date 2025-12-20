import { useDispatch } from 'react-redux';
import {
  UserManagementPage,
  AcceptInvitationPage,
} from '@open-kingdom/shared-frontend-feature-user-management';
import { baseApi } from '@open-kingdom/shared-frontend-data-access-api-client';
import { showNotification } from '@open-kingdom/shared-frontend-data-access-notifications';

export function UserManagementRoute() {
  const dispatch = useDispatch();

  return (
    <UserManagementPage
      api={baseApi}
      onNotify={(type, msg) => dispatch(showNotification(msg, type))}
    />
  );
}

export function AcceptInvitationRoute() {
  const dispatch = useDispatch();

  return (
    <AcceptInvitationPage
      api={baseApi}
      loginUrl="/profile"
      onNotify={(type, msg) => dispatch(showNotification(msg, type))}
    />
  );
}
