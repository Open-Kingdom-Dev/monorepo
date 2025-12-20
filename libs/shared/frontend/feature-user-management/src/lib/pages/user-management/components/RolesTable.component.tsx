import { styles } from '../../../styles';
import type { CustomRole } from '../../../types/user-management.types';

interface RolesTableProps {
  roles: CustomRole[];
  onDelete: (roleId: number) => void;
}

export function RolesTable({ roles, onDelete }: RolesTableProps) {
  return (
    <table className={styles.table}>
      <thead className={styles.tableHeader}>
        <tr>
          <th className={styles.tableHeaderCell}>Name</th>
          <th className={styles.tableHeaderCell}>Description</th>
          <th className={`${styles.tableHeaderCell} text-right`}>Actions</th>
        </tr>
      </thead>
      <tbody className={styles.tableBody}>
        {roles.map((role) => (
          <tr key={role.id} className={styles.tableRow}>
            <td className={styles.tableCell}>{role.name}</td>
            <td className={`${styles.tableCell} ${styles.textMuted}`}>
              {role.description || '—'}
            </td>
            <td className={styles.tableCellActions}>
              <button
                onClick={() => onDelete(role.id)}
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
