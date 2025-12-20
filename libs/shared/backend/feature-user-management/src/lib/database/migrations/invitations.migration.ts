import { sql } from 'drizzle-orm';
import { InvitationsTableName } from '../../invitations/entities/index.js';

export const createInvitationsTable = sql`
  CREATE TABLE IF NOT EXISTS ${sql.identifier(InvitationsTableName)} (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    role TEXT DEFAULT 'user',
    custom_role_id INTEGER,
    token TEXT NOT NULL UNIQUE,
    token_expiry INTEGER NOT NULL,
    invited_by INTEGER NOT NULL,
    invited_at INTEGER NOT NULL,
    status TEXT DEFAULT 'pending'
  )
`;
