import { getTableName } from 'drizzle-orm';
import { getTableConfig } from 'drizzle-orm/sqlite-core';

import {
  users,
  createUsersSchema,
} from '@open-kingdom/shared-backend-data-access-users';
import {
  activityLog,
  createActivityLogSchema,
  ActivityLogTableName,
} from './activity-log.schema';

describe('Activity log schema factory', () => {
  it('builds the unprefixed table by default', () => {
    const schema = createActivityLogSchema({ users });
    expect(getTableName(schema.activityLog)).toBe(ActivityLogTableName);
  });

  it('exposes an unprefixed singleton for standalone hosts', () => {
    expect(getTableName(activityLog)).toBe('activity_log');
  });

  it('prefixes the table name when a prefix is supplied', () => {
    const prefixedUsers = createUsersSchema('pfx_');
    const schema = createActivityLogSchema(
      { users: prefixedUsers.users },
      'pfx_'
    );
    expect(getTableName(schema.activityLog)).toBe('pfx_activity_log');
  });

  it('points a prefixed instance at the same-prefix users table', () => {
    const prefixedUsers = createUsersSchema('pfx_');
    const schema = createActivityLogSchema(
      { users: prefixedUsers.users },
      'pfx_'
    );
    const [fk] = getTableConfig(schema.activityLog).foreignKeys;
    expect(getTableName(fk.reference().foreignTable)).toBe('pfx_users');
  });
});
