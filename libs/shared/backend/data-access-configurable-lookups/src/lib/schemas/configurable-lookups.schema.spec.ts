import { getTableName } from 'drizzle-orm';

import {
  configurableLookups,
  createConfigurableLookupsSchema,
  ConfigurableLookupsTableName,
} from './configurable-lookups.schema';

describe('Configurable lookups schema factory', () => {
  it('builds the unprefixed table by default', () => {
    const schema = createConfigurableLookupsSchema();
    expect(getTableName(schema.configurableLookups)).toBe(
      ConfigurableLookupsTableName
    );
  });

  it('exposes an unprefixed singleton for standalone hosts', () => {
    expect(getTableName(configurableLookups)).toBe('configurable_lookups');
  });

  it('prefixes the table name when a prefix is supplied', () => {
    const schema = createConfigurableLookupsSchema('pfx_');
    expect(getTableName(schema.configurableLookups)).toBe(
      'pfx_configurable_lookups'
    );
  });
});
