import { crmNavEntries, crmRoutes } from './routes';

describe('crm routes export', () => {
  it('exposes the top-level /crm route tree', () => {
    expect(crmRoutes).toHaveLength(1);
    expect(crmRoutes[0].path).toBe('crm');
  });

  it('has an index route plus one per domain entity', () => {
    const children = crmRoutes[0].children ?? [];
    const paths = children.map((c) => ('path' in c ? c.path : '<index>'));
    expect(paths).toContain('contacts');
    expect(paths).toContain('companies');
    expect(paths).toContain('leads');
    expect(paths).toContain('leads/:id');
    expect(paths).toContain('opportunities');
  });

  it('exports nav entries for every top-level CRM section', () => {
    const labels = crmNavEntries.map((e) => e.label);
    expect(labels).toContain('Dashboard');
    expect(labels).toContain('Contacts');
    expect(labels).toContain('Companies');
    expect(labels).toContain('Leads');
    expect(labels).toContain('Pipeline');
  });
});
