import { getTableName } from 'drizzle-orm';
import { getTableConfig } from 'drizzle-orm/sqlite-core';

import { createUsersSchema } from '@open-kingdom/shared-backend-data-access-users';
import { createContactsSchema } from '@open-kingdom/crm-backend-data-access-contacts';
import { leads, opportunities, createOpportunitiesSchema } from './index';

const fkTargets = (table: Parameters<typeof getTableConfig>[0]) =>
  getTableConfig(table).foreignKeys.map((fk) =>
    getTableName(fk.reference().foreignTable)
  );

describe('createOpportunitiesSchema', () => {
  describe('default (unprefixed) schema', () => {
    it('uses the bare table names', () => {
      expect(getTableName(leads)).toBe('leads');
      expect(getTableName(opportunities)).toBe('opportunities');
    });

    it('references the unprefixed dependency tables', () => {
      expect(fkTargets(leads)).toEqual(
        expect.arrayContaining(['users', 'companies', 'contacts'])
      );
      expect(fkTargets(opportunities)).toEqual(
        expect.arrayContaining(['users', 'companies', 'contacts'])
      );
    });
  });

  describe('prefixed schema', () => {
    const prefix = 'pfx_';
    const pfxUsers = createUsersSchema(prefix);
    const pfxContacts = createContactsSchema({ users: pfxUsers.users }, prefix);
    const pfx = createOpportunitiesSchema(
      {
        users: pfxUsers.users,
        companies: pfxContacts.companies,
        contacts: pfxContacts.contacts,
      },
      prefix
    );

    it('prefixes the table names', () => {
      expect(getTableName(pfx.leads)).toBe('pfx_leads');
      expect(getTableName(pfx.opportunities)).toBe('pfx_opportunities');
    });

    it('points foreign keys at the same-prefix dependency tables', () => {
      // leads carries five FKs: contact, company, converted_to_contact,
      // converted_to_company, and owner — all must land on prefixed tables.
      expect(fkTargets(pfx.leads).sort()).toEqual([
        'pfx_companies',
        'pfx_companies',
        'pfx_contacts',
        'pfx_contacts',
        'pfx_users',
      ]);
      expect(fkTargets(pfx.opportunities)).toEqual(
        expect.arrayContaining(['pfx_users', 'pfx_companies', 'pfx_contacts'])
      );
    });

    it('prefixes explicit index names', () => {
      const indexNames = getTableConfig(pfx.opportunities).indexes.map(
        (idx) => idx.config.name
      );
      expect(indexNames).toEqual(
        expect.arrayContaining([
          'pfx_opportunities_owner_idx',
          'pfx_opportunities_stage_idx',
          'pfx_opportunities_company_idx',
          'pfx_opportunities_close_date_idx',
        ])
      );
    });
  });
});
