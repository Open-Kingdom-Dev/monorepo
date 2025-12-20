import { styles } from '../../../styles';
import { formatUserName } from '../../../utils';
import { RoleBadge } from '../../../components';
import type { User } from '../../../types';

interface UsersTableProps {
  users: User[];
  onDelete: (userId: number) => void;
}

export function UsersTable({ users, onDelete }: UsersTableProps) {
  return (
    <table className={styles.table}>
      <thead className={styles.tableHeader}>
        <tr>
          <th className={styles.tableHeaderCell}>Email</th>
          <th className={styles.tableHeaderCell}>Name</th>
          <th className={styles.tableHeaderCell}>Role</th>
          <th className={`${styles.tableHeaderCell} text-right`}>Actions</th>
        </tr>
      </thead>
      <tbody className={styles.tableBody}>
        {users.map((user) => (
          <tr key={user.id} className={styles.tableRow}>
            <td className={styles.tableCell}>{user.email}</td>
            <td className={styles.tableCell}>{formatUserName(user)}</td>
            <td className={styles.tableCell}>
              <RoleBadge userRole={user.role} isPending={user.isPending} />
            </td>
            <td className={styles.tableCellActions}>
              <button
                onClick={() => onDelete(user.id)}
                className={styles.buttonDanger}
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
