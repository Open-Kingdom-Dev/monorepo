# OKRE-95: Create initial Configuration

### Summary

Create the initial configuration for the Google Cloud Storage Twin integration test double, following section 4 of the implementation guide. This configuration establishes environment variables, activation gates, and a typed configuration object to enable a local GCS emulator for integration testing.

### Context

The goal is to provide a robust local GCS emulator setup that exercises the full storage pipeline (upload, download, signed URLs, listing, deletion, and content hashing) with zero changes to application code. The configuration should establish conventions for environment variables, twin activation, and configuration objects, as outlined in section 4 of the implementation guide:
[01-gcs-twin.md#4-configuration](../twins/01-gcs-twin.md#4-configuration)

### Acceptance criteria

* Define and document the following environment variables with sensible defaults:
    * `STORAGE_EMULATOR_HOST` (default: `http://localhost:9013`)
    * `GCS_TWIN_PORT` (default: `9013`)
    * `GCS_TWIN_SEED_DIR` (default: `./src/gcs/seed-data`)
    * `GCS_TWIN_DATA_DIR` (default: temp/ephemeral directory)
* Implement an activation gate using a shared utility function (e.g., `isTestMode()`) that checks if a specific environment variable (such as `TEST_MODE`) is truthy before starting the twin.
* Create a typed configuration object (`GcsTwinConfig`) with fields for port, external URL, seed data directory, and bucket seed configuration.
* Provide a default configuration object (`defaultGcsConfig`) with at least two buckets: one with seed files and one for uploads.
* Ensure all configuration is reusable and follows library-wide conventions for subsequent twins.

### Other information

* The configuration should allow for partial overrides in the constructor.
* The activation check and configuration object patterns are to be reused by all future twins.
* No application code changes are required; the SDK’s built-in emulator support handles routing.
* Reference implementation details and code snippets are available in [section 4 of the guide](../twins/01-gcs-twin.md#4-configuration).
