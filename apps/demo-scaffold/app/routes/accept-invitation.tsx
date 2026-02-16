import { useSearchParams } from 'react-router';
import {
  AcceptInvitation,
  StatusCard,
} from '@open-kingdom/shared-frontend-feature-user-management';

export default function AcceptInvitationRoute() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  if (!token) {
    return (
      <StatusCard
        variant="error"
        title="Missing Token"
        message="No invitation token was provided. Please use the link from your invitation email."
      />
    );
  }

  return <AcceptInvitation token={token} loginPath="/profile" />;
}
