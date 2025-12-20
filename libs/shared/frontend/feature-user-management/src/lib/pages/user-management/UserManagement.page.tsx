import { useState, useMemo, type ReactNode } from 'react';
import { styles } from '../../styles';
import { createUserManagementEndpoints } from '../../api';
import { UsersTab } from './tabs';
import { RolesTab } from './tabs';
import type { User, BaseApi } from '../../types';

export interface ColumnDef {
  field: string;
  headerName: string;
  width?: number;
  flex?: number;
}

export interface UserManagementPageProps {
  api: BaseApi;
  renderTable?: (data: User[], columns: ColumnDef[]) => ReactNode;
  onNotify?: (type: 'success' | 'error' | 'warning', message: string) => void;
  className?: string;
}

type TabType = 'users' | 'roles';

const TABS: { id: TabType; label: string }[] = [
  { id: 'users', label: 'Users' },
  { id: 'roles', label: 'Roles' },
];

export function UserManagementPage({
  api,
  renderTable,
  onNotify,
  className = '',
}: UserManagementPageProps) {
  const [activeTab, setActiveTab] = useState<TabType>('users');

  const injectedApi = useMemo(
    () =>
      api.injectEndpoints({
        endpoints: createUserManagementEndpoints,
        overrideExisting: false,
      }),
    [api]
  );

  const getTabClass = (tab: TabType) =>
    activeTab === tab ? styles.tabActive : styles.tab;

  return (
    <div className={`${styles.card} ${className}`}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>User Management</h1>
      </div>

      <div className={styles.tabList}>
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={getTabClass(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'users' ? (
        <UsersTab
          api={api}
          injectedApi={injectedApi}
          onNotify={onNotify}
          renderTable={renderTable}
        />
      ) : (
        <RolesTab injectedApi={injectedApi} onNotify={onNotify} />
      )}
    </div>
  );
}
