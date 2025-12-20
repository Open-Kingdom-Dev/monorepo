import { styles } from '../../../styles';
import { useRolesApi } from '../hooks';
import { RolesTable, CreateRoleForm } from '../components';

interface RolesTabProps {
  injectedApi: Parameters<typeof useRolesApi>[0];
  onNotify?: (type: 'success' | 'error' | 'warning', message: string) => void;
}

export function RolesTab({ injectedApi, onNotify }: RolesTabProps) {
  const { roles, isLoading, isCreating, deleteRole, createRole } = useRolesApi(
    injectedApi,
    onNotify
  );

  const renderContent = () => {
    if (isLoading) return <p className={styles.loading}>Loading roles...</p>;
    if (!roles?.length)
      return <p className={styles.empty}>No custom roles created yet</p>;
    return <RolesTable roles={roles} onDelete={deleteRole} />;
  };

  return (
    <>
      <CreateRoleForm onSubmit={createRole} isLoading={isCreating} />
      {renderContent()}
    </>
  );
}
