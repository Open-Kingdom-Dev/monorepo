import { useState, useCallback, type ReactNode } from 'react';
import { styles } from '../../../styles';
import { InviteUserModal } from '../../../components';
import { useUsersApi } from '../hooks';
import { UsersTable } from '../components';
import type { User } from '../../../types';
import type {
  ColumnDef,
  UserManagementPageProps,
} from '../UserManagement.page';

interface UsersTabProps {
  api: UserManagementPageProps['api'];
  injectedApi: Parameters<typeof useUsersApi>[0];
  onNotify?: (type: 'success' | 'error' | 'warning', message: string) => void;
  renderTable?: (data: User[], columns: ColumnDef[]) => ReactNode;
}

export function UsersTab({
  api,
  injectedApi,
  onNotify,
  renderTable,
}: UsersTabProps) {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const { users, isLoading, error, deleteUser, refetch } = useUsersApi(
    injectedApi,
    onNotify
  );

  const openInviteModal = useCallback(() => setIsInviteModalOpen(true), []);
  const closeInviteModal = useCallback(() => setIsInviteModalOpen(false), []);

  const handleInviteSuccess = useCallback(() => {
    closeInviteModal();
    refetch();
    onNotify?.('success', 'Invitation sent successfully');
  }, [closeInviteModal, refetch, onNotify]);

  const renderContent = () => {
    if (isLoading) return <p className={styles.loading}>Loading users...</p>;
    if (error) return <p className={styles.error}>Failed to load users</p>;
    if (!users?.length) return <p className={styles.empty}>No users found</p>;

    if (renderTable) {
      return renderTable(users, [
        { field: 'email', headerName: 'Email', flex: 2 },
        { field: 'firstName', headerName: 'First Name', flex: 1 },
        { field: 'lastName', headerName: 'Last Name', flex: 1 },
        { field: 'role', headerName: 'Role', width: 100 },
      ]);
    }

    return <UsersTable users={users} onDelete={deleteUser} />;
  };

  return (
    <>
      <div className={styles.tabHeader}>
        <button onClick={openInviteModal} className={styles.buttonPrimary}>
          Invite User
        </button>
      </div>

      {renderContent()}

      <InviteUserModal
        api={api}
        isOpen={isInviteModalOpen}
        onClose={closeInviteModal}
        onSuccess={handleInviteSuccess}
        onNotify={onNotify}
      />
    </>
  );
}
