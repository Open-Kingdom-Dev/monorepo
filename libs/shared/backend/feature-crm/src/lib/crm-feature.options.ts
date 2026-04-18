export const CRM_FEATURE_OPTIONS = 'CRM_FEATURE_OPTIONS';

export interface CrmFeatureOptions {
  /**
   * Whether to seed default CRM lookup entries (stages, statuses, sources,
   * activity types) and map baseline CRM permissions to system roles on
   * module initialization. Defaults to true.
   */
  seedDefaults?: boolean;
}
