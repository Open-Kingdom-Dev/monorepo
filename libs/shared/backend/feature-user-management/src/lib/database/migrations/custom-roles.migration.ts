import { sql } from 'drizzle-orm';
import { CustomRolesTableName } from '../../roles/entities/index.js';

export const createCustomRolesTable = sql`
  CREATE TABLE IF NOT EXISTS ${sql.identifier(CustomRolesTableName)} (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    permissions TEXT,
    created_at INTEGER NOT NULL,
    created_by INTEGER NOT NULL
  )
`;
