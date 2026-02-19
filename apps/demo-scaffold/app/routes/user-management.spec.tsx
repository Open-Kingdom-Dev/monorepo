import { render } from '@testing-library/react';
import UserManagement from './user-management';

jest.mock('@open-kingdom/shared-frontend-data-access-api-client', () => ({
  useAuthControllerGetProfileQuery: jest.fn().mockReturnValue({
    data: { id: 1 },
  }),
}));

jest.mock('@open-kingdom/shared-frontend-feature-user-management', () => ({
  UserList: ({ currentUserId }: { currentUserId?: number }) => (
    <div data-testid="user-list">UserList userId={currentUserId}</div>
  ),
  InvitationList: () => <div data-testid="invitation-list">InvitationList</div>,
}));

describe('UserManagement', () => {
  it('renders the user list with the current user id', () => {
    const { getByTestId } = render(<UserManagement />);
    expect(getByTestId('user-list').textContent).toContain('userId=1');
  });

  it('renders the invitation list', () => {
    const { getByTestId } = render(<UserManagement />);
    expect(getByTestId('invitation-list')).toBeTruthy();
  });
});
