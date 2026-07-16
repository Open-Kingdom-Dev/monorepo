import { getTableName } from 'drizzle-orm';
import { getTableConfig } from 'drizzle-orm/sqlite-core';

import { createUsersSchema } from '@open-kingdom/shared-backend-data-access-users';
import { companies, contacts, createContactsSchema } from './index';

const fkTargets = (table: Parameters<typeof getTableConfig>[0]) =>
  getTableConfig(table).foreignKeys.map((fk) =>
    getTableName(fk.reference().foreignTable)
  );

describe('createContactsSchema', () => {
  describe('default (unprefixed) schema', () => {
    it('uses the bare table names', () => {
      expect(getTableName(companies)).toBe('companies');
      expect(getTableName(contacts)).toBe('contacts');
    });

    it('references the unprefixed dependency tables', () => {
      expect(fkTargets(companies)).toEqual(['users']);
      expect(fkTargets(contacts)).toEqual(
        expect.arrayContaining(['users', 'companies'])
      );
    });
  });

  describe('prefixed schema', () => {
    const prefix = 'pfx_';
    const pfxUsers = createUsersSchema(prefix);
    const pfx = createContactsSchema({ users: pfxUsers.users }, prefix);

    it('prefixes the table names', () => {
      expect(getTableName(pfx.companies)).toBe('pfx_companies');
      expect(getTableName(pfx.contacts)).toBe('pfx_contacts');
    });

    it('points foreign keys at the same-prefix dependency tables', () => {
      expect(fkTargets(pfx.companies)).toEqual(['pfx_users']);
      expect(fkTargets(pfx.contacts)).toEqual(
        expect.arrayContaining(['pfx_users', 'pfx_companies'])
      );
    });

    it('prefixes explicit index names', () => {
      const indexNames = getTableConfig(pfx.companies).indexes.map(
        (idx) => idx.config.name
      );
      expect(indexNames).toEqual(
        expect.arrayContaining([
          'pfx_companies_owner_idx',
          'pfx_companies_name_idx',
          'pfx_companies_status_idx',
        ])
      );
    });
  });
});
