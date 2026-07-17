export const DB_TAG = 'DB';

/**
 * Injection token for the composed Drizzle schema object (the same object
 * passed to `DatabaseSetupModule.register({ schema })`). Services resolve
 * their table objects through this token instead of importing module-scope
 * singletons, so hosts can compose a table-name-prefixed schema (embedded
 * mode) and every service transparently operates on the prefixed tables.
 */
export const SCHEMA_TAG = 'DB_SCHEMA';
