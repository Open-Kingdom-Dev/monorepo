import {
  FeatureUserManagementModule,
  USER_MANAGEMENT_OPTIONS,
  UserManagementModuleOptions,
} from './feature-user-management.module';

describe('FeatureUserManagementModule', () => {
  describe('configuration', () => {
    const mockOptions: UserManagementModuleOptions = {
      invitationTokenSecret: 'test-secret',
      invitationExpiryDays: 7,
      frontendBaseUrl: 'http://localhost:3000',
    };

    it('configures the module with provided options', () => {
      const result = FeatureUserManagementModule.forRoot(mockOptions);

      expect(result.module).toBe(FeatureUserManagementModule);
      expect(result.imports).toBeDefined();
      expect(result.providers).toBeDefined();
      expect(result.exports).toBeDefined();
    });

    it('makes configuration available to services', () => {
      const result = FeatureUserManagementModule.forRoot(mockOptions);

      const optionsProvider = result.providers?.find(
        (p) =>
          typeof p === 'object' &&
          'provide' in p &&
          p.provide === USER_MANAGEMENT_OPTIONS
      );

      expect(optionsProvider).toBeDefined();
      expect(
        (optionsProvider as { useValue: UserManagementModuleOptions }).useValue
      ).toEqual(mockOptions);
    });
  });
});
