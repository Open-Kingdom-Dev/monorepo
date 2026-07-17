export const CRM_FEATURE_OPTIONS = 'CRM_FEATURE_OPTIONS';

/**
 * What CrmSeedService seeds on module init:
 * - 'full'    — lookup entries AND the baseline CRM permission mapping onto
 *               the system roles (requires FeatureUserManagementModule).
 * - 'lookups' — lookup entries only. Use this in embedded hosts that bring
 *               their own identity/RBAC and do not register user-management.
 * - 'none'    — seed nothing.
 */
export type CrmSeedMode = 'none' | 'lookups' | 'full';

export interface CrmFeatureOptions {
  /**
   * Whether to seed default CRM lookup entries (stages, statuses, sources,
   * activity types) and map baseline CRM permissions to system roles on
   * module initialization. Defaults to true.
   *
   * @deprecated Use `seed` instead: `true` ≡ 'full', `false` ≡ 'none'.
   * Ignored when `seed` is set.
   */
  seedDefaults?: boolean;

  /** Seed mode — see {@link CrmSeedMode}. Defaults to 'full'. */
  seed?: CrmSeedMode;
}

/** Resolves the effective seed mode from new + legacy options. */
export function resolveSeedMode(
  options: CrmFeatureOptions | null | undefined
): CrmSeedMode {
  if (options?.seed) return options.seed;
  if (options?.seedDefaults === false) return 'none';
  return 'full';
}
