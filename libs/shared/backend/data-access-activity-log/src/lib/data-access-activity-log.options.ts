export const ACTIVITY_LOG_OPTIONS = 'ACTIVITY_LOG_OPTIONS';

export interface DataAccessActivityLogOptions {
  /**
   * Allowed values for the polymorphic `relatedType` column. When omitted,
   * any non-empty string is accepted (use this in tests, or when the host
   * application has not yet decided on a fixed vocabulary).
   */
  allowedRelatedTypes?: ReadonlyArray<string>;

  /**
   * Allowed values for the activity `type` column (e.g. `note`, `call`,
   * `email`, `task`, `meeting` for a CRM; or `comment`, `attachment`,
   * `status-change` for an issue tracker). When omitted, any non-empty
   * string is accepted.
   */
  allowedActivityTypes?: ReadonlyArray<string>;
}
