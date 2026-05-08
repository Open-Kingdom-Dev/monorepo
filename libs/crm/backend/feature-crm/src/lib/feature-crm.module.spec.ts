import { FeatureCrmModule } from './feature-crm.module';

describe('FeatureCrmModule', () => {
  it('is defined', () => {
    expect(FeatureCrmModule).toBeDefined();
  });

  it('forRoot returns a dynamic module with the expected providers', () => {
    const dyn = FeatureCrmModule.forRoot();
    expect(dyn.module).toBe(FeatureCrmModule);
    expect(dyn.providers?.length).toBeGreaterThan(0);
    expect(dyn.controllers?.length).toBeGreaterThan(0);
  });

  it('forRoot accepts seed options', () => {
    const dyn = FeatureCrmModule.forRoot({ seedDefaults: false });
    expect(dyn.providers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ useValue: { seedDefaults: false } }),
      ])
    );
  });
});
